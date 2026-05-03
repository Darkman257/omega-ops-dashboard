// ─── Link Fleet to Staff ────────────────────────────────────────────────────────
// Maps existing vehicle drivers to staff internal_codes by matching names.
// Sets vehicles.driver_code = staff.internal_code.
// If no match is found, leaves driver_code as NULL.
//
// Usage:
//   DRY RUN: pnpm --filter @workspace/omega-dashboard run link-fleet
//   PUSH:    pnpm --filter @workspace/omega-dashboard run link-fleet -- --push
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const rawArgs  = process.argv.slice(2).filter(a => a !== '--');
const pushMode = rawArgs.includes('--push');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SEP      = '━'.repeat(80);

console.log(`\n${SEP}`);
console.log(`  OMEGA — FLEET STAFF LINK MIGRATION`);
console.log(`  Mode: ${pushMode ? 'PUSH → Supabase' : 'DRY RUN (no DB writes)'}`);
console.log(`  Time: ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

// 1. Fetch all staff members
console.log(`  [1/3] Fetching staff list...`);
const { data: staffData, error: staffErr } = await supabase
  .from('staff')
  .select('internal_code, full_name');

if (staffErr) {
  console.error(`  ✗ Staff fetch failed: ${staffErr.message}`);
  process.exit(1);
}

const staffMap = new Map<string, string>(); // name -> code
for (const s of staffData ?? []) {
  if (s.full_name && s.internal_code) {
    staffMap.set(s.full_name.trim().toLowerCase(), s.internal_code);
  }
}
console.log(`  Found ${staffMap.size} staff members with internal codes.\n`);

// 2. Fetch all vehicles
console.log(`  [2/3] Fetching vehicles...`);
const { data: vehiclesData, error: vehErr } = await supabase
  .from('vehicles')
  .select('id, car_name, plate_number, driver, driver_code');

if (vehErr) {
  console.error(`  ✗ Vehicles fetch failed: ${vehErr.message}`);
  process.exit(1);
}

const vehicles = vehiclesData ?? [];
console.log(`  Found ${vehicles.length} vehicles in fleet.\n`);

// 3. Mapping phase
console.log(`  [3/3] Mapping drivers to staff codes...\n`);

console.log(`  ${'Vehicle'.padEnd(20)}${'Driver Name'.padEnd(30)}Link Result`);
console.log(`  ${'─'.repeat(75)}`);

const toUpdate: { id: string; driver_code: string | null }[] = [];
let matched = 0;
let unassigned = 0;

for (const v of vehicles) {
  const driverName = (v.driver || '').trim();
  const searchName = driverName.toLowerCase();

  let code: string | null = null;
  let status = '';

  if (!driverName) {
    status = `📭 EMPTY (No driver assigned)`;
    unassigned++;
  } else {
    // Exact match
    if (staffMap.has(searchName)) {
      code = staffMap.get(searchName)!;
      status = `✅ MATCHED (${code})`;
      matched++;
    } else {
      // Partial match fallback (if driver name is a substring of staff name or vice versa)
      let foundCode = null;
      for (const [staffName, staffCode] of staffMap.entries()) {
        if (staffName.includes(searchName) || searchName.includes(staffName)) {
          foundCode = staffCode;
          break;
        }
      }
      
      if (foundCode) {
        code = foundCode;
        status = `✅ PARTIAL MATCH (${code})`;
        matched++;
      } else {
        status = `❌ NO MATCH (unassigned_driver)`;
        unassigned++;
      }
    }
  }

  // Record for update if changed
  if (v.driver_code !== code) {
    toUpdate.push({ id: v.id, driver_code: code });
  }

  console.log(
    `  ${(v.plate_number || v.car_name).slice(0, 18).padEnd(20)}` +
    `${driverName.slice(0, 28).padEnd(30)}` +
    `${status}`
  );
}

console.log(`\n  ─── Summary ───`);
console.log(`  Total Vehicles: ${vehicles.length}`);
console.log(`  Successfully Matched: ${matched}`);
console.log(`  Unassigned / No Match: ${unassigned}`);
console.log(`  Vehicles requiring DB update: ${toUpdate.length}`);

if (!pushMode) {
  console.log(`\n  ℹ DRY RUN — no data was written.`);
  console.log(`  To push, add --push flag.`);
  console.log(`${SEP}\n`);
  process.exit(0);
}

if (toUpdate.length === 0) {
  console.log(`\n  ✅ All vehicles are already correctly linked. Nothing to update.`);
  console.log(`${SEP}\n`);
  process.exit(0);
}

console.log(`\n  Pushing updates to Supabase...`);

let errors = 0;
let updated = 0;

for (const update of toUpdate) {
  const { error: updErr } = await supabase
    .from('vehicles')
    .update({ driver_code: update.driver_code })
    .eq('id', update.id);
  
  if (updErr) {
    console.error(`  ✗ Failed to update vehicle ${update.id}: ${updErr.message}`);
    errors++;
  } else {
    updated++;
  }
}

console.log(`\n${SEP}`);
console.log(`  MIGRATION COMPLETE`);
console.log(`  Updated: ${updated}`);
console.log(`  Errors:  ${errors}`);
console.log(`${SEP}\n`);
