// ─── Housing Link Audit ───────────────────────────────────────────────────────
// Audits housing assignments and unit capacities.
//
// Usage: pnpm --filter @workspace/omega-dashboard run housing-audit
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SEP = '━'.repeat(80);

async function run() {
  console.log(`\n${SEP}`);
  console.log(`  OMEGA — HOUSING LINK AUDIT REPORT`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log(`${SEP}\n`);

  // Fallback try/catch if tables don't exist yet
  try {
    const { data: units, error: unitErr } = await supabase.from('housing_units').select('*');
    if (unitErr) throw unitErr;
    
    const { data: residents, error: resErr } = await supabase.from('housing_assignments').select('*');
    if (resErr) throw resErr;

    const allUnits = units || [];
    const allRes = residents || [];
    
    let occupiedUnits = 0;
    let overCap = 0;
    let pending = 0;
    
    const unitMap = new Map(allUnits.map(u => [u.id, u]));
    
    for (const u of allUnits) {
      if (u.occupants > 0) occupiedUnits++;
      if (u.capacity > 0 && u.occupants > u.capacity) overCap++;
    }
    
    for (const r of allRes) {
      if (r.assignment_status !== 'linked') pending++;
    }

    console.log(`  Total Units: ${allUnits.length}`);
    console.log(`  Occupied Units: ${occupiedUnits}`);
    console.log(`  Over-capacity Units: ${overCap}`);
    console.log(`  Total Residents: ${allRes.length}`);
    console.log(`  Pending Residents: ${pending}`);

  } catch (err: any) {
    console.log(`  ⚠ Audit failed (tables might not be fully migrated yet).`);
    console.log(`    Error: ${err.message}`);
  }

  console.log(`\n${SEP}\n`);
}

run().catch(console.error);
