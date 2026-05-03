// ─── Fleet Link Audit ──────────────────────────────────────────────────────────
// Audits fleet assignment logic and provides reports on pending vehicles
// and drivers assigned to multiple vehicles.
//
// Usage: pnpm --filter @workspace/omega-dashboard run fleet-audit
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SEP = '━'.repeat(80);

async function run() {
  console.log(`\n${SEP}`);
  console.log(`  OMEGA — FLEET LINK AUDIT REPORT`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log(`${SEP}\n`);

  const { data: vehicles, error } = await supabase.from('vehicles').select('*');
  if (error) {
    console.error(`  ✗ Error: ${error.message}`);
    process.exit(1);
  }

  const all = vehicles || [];
  let linked = 0;
  let pending = 0;
  const driverCounts = new Map<string, number>();

  for (const v of all) {
    if (v.assignment_status === 'linked' || v.driver_code) {
      linked++;
      const code = v.driver_code;
      if (code) driverCounts.set(code, (driverCounts.get(code) || 0) + 1);
    } else if (v.driver) {
      pending++;
    }
  }

  console.log(`  Total Vehicles: ${all.length}`);
  console.log(`  Linked Vehicles: ${linked}`);
  console.log(`  Pending Drivers: ${pending}`);
  
  const multiple = [...driverCounts.entries()].filter(([_, count]) => count > 1);
  console.log(`  Drivers with multiple vehicles: ${multiple.length}`);
  
  if (multiple.length > 0) {
    console.log(`\n  ⚠️ Multiple Vehicle Assignments:`);
    for (const [code, count] of multiple) {
      console.log(`    - Code ${code} assigned to ${count} vehicles`);
    }
  }
  
  console.log(`\n${SEP}\n`);
}

run().catch(console.error);
