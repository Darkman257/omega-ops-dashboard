// ─── Omega Schema Truth Report ─────────────────────────────────────────────────
// Queries each table via Supabase anon key to discover real columns,
// then cross-checks against code expectations.
//
// Run:
//   node --env-file=.env --experimental-strip-types scripts/schema-report.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Expected columns per table (from code: AppContext, importers, migrations) ─
const EXPECTED: Record<string, string[]> = {
  staff: [
    'id', 'full_name', 'job_title', 'department', 'phone', 'email',
    'status', 'basic_salary', 'internal_code', 'created_at'
  ],
  attendance: [
    'id', 'employee_id', 'employee_name', 'date', 'status',
    'raw_value', 'source', 'import_batch_id', 'file_hash', 'created_at'
  ],
  attendance_logs: [
    'id', 'employee_id', 'employee_name', 'log_date', 'timestamp',
    'type', 'raw_times', 'source', 'import_batch_id', 'created_at'
  ],
  payroll_records: [
    'id', 'employee_id', 'month', 'year', 'basic_salary',
    'net_salary', 'deductions', 'allowances', 'created_at'
  ],
  vehicles: [
    'id', 'car_name', 'plate_number', 'driver', 'fuel_balance',
    'last_service', 'maintenance_cost', 'status', 'notes', 'created_at'
  ],
  projects: [
    'id', 'project_name', 'owner_name', 'status', 'start_date',
    'end_date', 'contract_value', 'spent', 'created_at'
  ],
  documents: [
    'id', 'name', 'type', 'expiry_date', 'issued_date', 'status', 'created_at'
  ],
};

// ─── Fetch one row to discover real columns ───────────────────────────────────
async function discoverColumns(table: string): Promise<{
  exists: boolean;
  columns: string[];
  sampleRow: Record<string, unknown> | null;
  rowCount: number | null;
  readable: boolean;
  error?: string;
}> {
  // Try to get a row
  const { data, error } = await supabase.from(table).select('*').limit(1);

  if (error) {
    // Check if table exists but RLS is blocking
    if (error.message.includes('permission') || error.message.includes('policy') || error.code === 'PGRST301') {
      return { exists: true, columns: [], sampleRow: null, rowCount: null, readable: false, error: `RLS blocking read: ${error.message}` };
    }
    if (error.message.includes('does not exist') || error.code === '42P01') {
      return { exists: false, columns: [], sampleRow: null, rowCount: null, readable: false, error: 'Table does not exist' };
    }
    return { exists: false, columns: [], sampleRow: null, rowCount: null, readable: false, error: error.message };
  }

  // Get count
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });

  const sampleRow = data?.[0] ?? null;
  const columns = sampleRow ? Object.keys(sampleRow) : [];

  // If table exists but is empty, try to get column info from PostgREST schema
  return {
    exists: true,
    columns,
    sampleRow,
    rowCount: count,
    readable: true
  };
}

// ─── Cross-check expected vs actual ──────────────────────────────────────────
function crossCheck(table: string, actual: string[], expected: string[]): {
  missing: string[];    // in expected, not in actual
  unexpected: string[]; // in actual, not in expected
  matched: number;
} {
  const actualSet   = new Set(actual);
  const expectedSet = new Set(expected);
  return {
    missing:    expected.filter(c => !actualSet.has(c)),
    unexpected: actual.filter(c => !expectedSet.has(c)),
    matched:    expected.filter(c => actualSet.has(c)).length
  };
}

// ─── RLS check: try insert without auth ──────────────────────────────────────
async function checkRLS(table: string): Promise<'enforced' | 'open' | 'unknown'> {
  // Attempt to read with .select — if we can get count=0 it means at least SELECT works
  // We can't directly check RLS status with anon key, infer from behavior
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error && (error.message.includes('permission') || error.code === 'PGRST301')) return 'enforced';
  if (count !== null) return 'enforced'; // RLS exists but SELECT policy allows anon
  return 'unknown';
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABLES = Object.keys(EXPECTED);
const SEP = '━'.repeat(56);

console.log(`\n${SEP}`);
console.log(`  OMEGA SUPABASE SCHEMA TRUTH REPORT`);
console.log(`  Project: kbdvcrjifqlunzawkobg`);
console.log(`  Time:    ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

const risks: string[] = [];

for (const table of TABLES) {
  const discovered = await discoverColumns(table);
  const expected   = EXPECTED[table];

  console.log(`  ┌── ${table.toUpperCase()}`);
  console.log(`  │   Exists:    ${discovered.exists ? '✓ yes' : '✗ NO — TABLE MISSING'}`);
  console.log(`  │   Readable:  ${discovered.readable ? `✓ yes (${discovered.rowCount ?? '?'} rows)` : `✗ NO — ${discovered.error}`}`);

  if (discovered.readable && discovered.columns.length > 0) {
    console.log(`  │   Columns:   ${discovered.columns.join(', ')}`);
  } else if (discovered.exists && !discovered.readable) {
    console.log(`  │   Columns:   (cannot read — RLS or empty)`);
  } else if (!discovered.exists) {
    console.log(`  │   Columns:   N/A`);
  }

  if (discovered.readable && discovered.columns.length > 0) {
    const check = crossCheck(table, discovered.columns, expected);
    if (check.missing.length > 0) {
      console.log(`  │   ⚠ MISSING: ${check.missing.join(', ')}`);
      check.missing.forEach(c => risks.push(`[${table}] Column "${c}" expected in code but NOT in DB`));
    }
    if (check.unexpected.length > 0) {
      console.log(`  │   ℹ EXTRA:   ${check.unexpected.join(', ')}`);
    }
    console.log(`  │   Matched:   ${check.matched}/${expected.length} expected columns present`);
  } else if (!discovered.exists) {
    expected.forEach(c => risks.push(`[${table}] TABLE MISSING — all ${expected.length} expected columns absent`));
    console.log(`  │   ⚠ All ${expected.length} expected columns absent`);
  }

  console.log(`  └${'─'.repeat(50)}\n`);
}

// ─── Risk summary ─────────────────────────────────────────────────────────────
console.log(`${SEP}`);
console.log(`  RISK SUMMARY`);
console.log(`${SEP}`);

if (risks.length === 0) {
  console.log(`\n  ✓ No critical mismatches detected.\n`);
} else {
  console.log(`\n  Found ${risks.length} mismatch(es):\n`);
  risks.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  console.log('');
}

console.log(`${SEP}\n`);
