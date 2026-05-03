// ─── Import Biometric-Only Employees ──────────────────────────────────────────
// Imports employees that exist ONLY in biometric logs but not in staff table.
// Uses biometric name if available, otherwise "Unknown".
//
// Usage:
//   DRY RUN: pnpm --filter @workspace/omega-dashboard run import-bio-staff
//   PUSH:    pnpm --filter @workspace/omega-dashboard run import-bio-staff -- --push
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const rawArgs  = process.argv.slice(2).filter(a => a !== '--');
const pushMode = rawArgs.includes('--push');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SEP      = '━'.repeat(80);

console.log(`\n${SEP}`);
console.log(`  OMEGA — IMPORT BIOMETRIC-ONLY EMPLOYEES`);
console.log(`  Mode: ${pushMode ? 'PUSH → Supabase' : 'DRY RUN (no DB writes)'}`);
console.log(`  Time: ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

// Step 1: Fetch all biometric codes + names
console.log(`  [1/3] Fetching biometric log codes...`);
const { data: bioData, error: bioErr } = await supabase
  .from('attendance_logs')
  .select('employee_id, employee_name');

if (bioErr) {
  console.error(`  ✗ Biometric fetch failed: ${bioErr.message}`);
  process.exit(1);
}

type BioRow = { employee_id: string; employee_name: string };
const bioMap = new Map<string, string>();
for (const r of (bioData ?? []) as BioRow[]) {
  const code = String(r.employee_id).trim();
  if (!code) continue;
  // Keep the longest / most complete name
  const existing = bioMap.get(code) ?? '';
  const newName  = (r.employee_name ?? '').trim();
  if (newName.length > existing.length) {
    bioMap.set(code, newName);
  }
}
console.log(`  Biometric unique codes: ${bioMap.size}`);

// Step 2: Fetch existing staff codes
console.log(`  [2/3] Fetching existing staff codes...`);
const { data: staffData, error: staffErr } = await supabase
  .from('staff')
  .select('internal_code');

if (staffErr) {
  console.error(`  ✗ Staff fetch failed: ${staffErr.message}`);
  process.exit(1);
}

const existingCodes = new Set<string>();
for (const s of staffData ?? []) {
  existingCodes.add(String(s.internal_code ?? ''));
}
console.log(`  Staff codes in DB: ${existingCodes.size}`);

// Step 3: Find missing codes
const missing: Array<{ code: string; name: string }> = [];
for (const [code, name] of bioMap) {
  if (!existingCodes.has(code)) {
    missing.push({ code, name: name || 'Unknown' });
  }
}

missing.sort((a, b) => Number(a.code) - Number(b.code));

console.log(`\n  [3/3] Missing from staff: ${missing.length}\n`);

if (missing.length === 0) {
  console.log(`  ✅ All biometric codes are already in staff table.`);
  console.log(`${SEP}\n`);
  process.exit(0);
}

// Print plan
console.log(`  ${'Code'.padEnd(10)}${'Biometric Name'.padEnd(30)}Action`);
console.log(`  ${'─'.repeat(55)}`);

for (const emp of missing) {
  console.log(
    `  ${emp.code.padEnd(10)}` +
    `${emp.name.slice(0, 28).padEnd(30)}` +
    `🆕 INSERT (biometric_only)`
  );
}

console.log(`\n  Total to insert: ${missing.length}`);

if (!pushMode) {
  console.log(`\n  ℹ DRY RUN — no data was written.`);
  console.log(`  To push, add --push flag.`);
  console.log(`${SEP}\n`);
  process.exit(0);
}

// Push
interface StaffInsert {
  internal_code: string;
  full_name: string;
  job_title: string;
  department: string;
  status: string;
}

const rows: StaffInsert[] = missing.map(emp => ({
  internal_code: emp.code,
  full_name:     emp.name,
  job_title:     'Biometric Only',
  department:    'Unassigned',
  status:        'active',
}));

console.log(`\n  Inserting ${rows.length} employees...`);
const { error: insertErr } = await supabase.from('staff').insert(rows);

if (insertErr) {
  console.error(`  ✗ Insert failed: ${insertErr.message}`);
  process.exit(1);
}

console.log(`  ✓ Inserted ${rows.length} biometric-only employees.`);

console.log(`\n${SEP}`);
console.log(`  IMPORT COMPLETE`);
console.log(`  Inserted: ${rows.length}`);
console.log(`  ⚠ These employees need HR review — names may be incomplete.`);
console.log(`${SEP}\n`);
