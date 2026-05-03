// ─── Import Obsidier Staff from Payroll Sheet ─────────────────────────────────
// Parses the Obsidier Tower wages CSV and upserts employees into staff table.
//
// Logic:
//   - internal_code = employee_id from payroll (col 1)
//   - Skips rows with no code or no name
//   - Does NOT duplicate: uses upsert on internal_code
//   - Does NOT modify payroll data
//
// Usage:
//   DRY RUN:  pnpm --filter @workspace/omega-dashboard run import-obsidier-staff -- ./data/april-rates.csv
//   PUSH:     pnpm --filter @workspace/omega-dashboard run import-obsidier-staff -- ./data/april-rates.csv --push
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const rawArgs  = process.argv.slice(2).filter(a => a !== '--');
const filePath = rawArgs.find(a => !a.startsWith('--')) ?? './data/april-rates.csv';
const pushMode = rawArgs.includes('--push');

// Payroll sheet column indexes
const COL = {
  CODE:       1,
  NAME:       4,
  JOB:        5,
  DAILY_RATE: 6,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParsedEmployee {
  internal_code: string;
  full_name: string;
  job_title: string;
  daily_rate: number;
}

interface StaffRow {
  internal_code: string;
  full_name: string;
  job_title: string;
  department: string;
  current_site: string;
  basic_salary: number;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function num(val: string | undefined): number {
  if (!val) return 0;
  const n = Number(val.trim().replace(/[^\d.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

// ─── Parse payroll sheet ──────────────────────────────────────────────────────
function parsePayrollStaff(path: string): ParsedEmployee[] {
  const results: ParsedEmployee[] = [];
  const raw   = fs.readFileSync(path, 'utf-8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split(',');

    const code = cols[COL.CODE]?.trim() ?? '';
    if (!code || isNaN(Number(code))) continue;

    const name = cols[COL.NAME]?.trim() ?? '';
    if (!name) continue;  // skip empty rows

    results.push({
      internal_code: code,
      full_name:     name,
      job_title:     cols[COL.JOB]?.trim() ?? '',
      daily_rate:    num(cols[COL.DAILY_RATE]),
    });
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SEP      = '━'.repeat(80);

console.log(`\n${SEP}`);
console.log(`  OMEGA — IMPORT OBSIDIER STAFF`);
console.log(`  File: ${filePath}`);
console.log(`  Mode: ${pushMode ? 'PUSH → Supabase' : 'DRY RUN (no DB writes)'}`);
console.log(`  Time: ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

if (!fs.existsSync(filePath)) {
  console.error(`  ✗ File not found: ${filePath}`);
  process.exit(1);
}

// Step 1: Parse payroll sheet
const parsed = parsePayrollStaff(filePath);
console.log(`  [1/3] Parsed ${parsed.length} employees from payroll sheet.\n`);

// Step 2: Fetch existing staff codes
console.log(`  [2/3] Fetching existing staff codes from Supabase...`);
const { data: existingStaff, error: fetchErr } = await supabase
  .from('staff')
  .select('internal_code');

if (fetchErr) {
  console.error(`  ✗ Staff fetch failed: ${fetchErr.message}`);
  process.exit(1);
}

const existingCodes = new Set<string>();
for (const s of existingStaff ?? []) {
  existingCodes.add(String(s.internal_code ?? ''));
}
console.log(`  Existing staff codes in DB: ${existingCodes.size}\n`);

// Step 3: Determine new vs existing
const toInsert: StaffRow[]   = [];
const alreadyExist: string[] = [];

for (const emp of parsed) {
  if (existingCodes.has(emp.internal_code)) {
    alreadyExist.push(emp.internal_code);
    continue;
  }

  toInsert.push({
    internal_code: emp.internal_code,
    full_name:     emp.full_name,
    job_title:     emp.job_title,
    department:    'Obsidier Tower',
    current_site:  'Obsidier Tower',
    basic_salary:  0,  // daily rate is not monthly salary — don't conflate
    status:        'active',
  });
}

// Print plan
console.log(`  [3/3] Import plan:\n`);
console.log(`  ${'Code'.padEnd(10)}${'Name'.padEnd(30)}${'Job'.padEnd(22)}Action`);
console.log(`  ${'─'.repeat(75)}`);

for (const emp of parsed) {
  const isNew = !existingCodes.has(emp.internal_code);
  const icon  = isNew ? '🆕' : '✅';
  const action = isNew ? 'INSERT' : 'SKIP (exists)';
  console.log(
    `  ${emp.internal_code.padEnd(10)}` +
    `${emp.full_name.slice(0, 28).padEnd(30)}` +
    `${emp.job_title.slice(0, 20).padEnd(22)}` +
    `${icon} ${action}`
  );
}

console.log('');
console.log(`  ─── Summary ───`);
console.log(`  Total in payroll:  ${parsed.length}`);
console.log(`  Already in staff:  ${alreadyExist.length}  (${alreadyExist.join(', ') || '—'})`);
console.log(`  New to insert:     ${toInsert.length}`);

if (!pushMode) {
  console.log(`\n  ℹ DRY RUN — no data was written.`);
  console.log(`  To push, add --push flag.`);
  console.log(`${SEP}\n`);
  process.exit(0);
}

// Push to Supabase
if (toInsert.length === 0) {
  console.log(`\n  ✅ All employees already in staff table. Nothing to insert.`);
  console.log(`${SEP}\n`);
  process.exit(0);
}

console.log(`\n  Inserting ${toInsert.length} employees...`);

// Insert in batches of 50
const BATCH = 50;
let inserted = 0;
let errors   = 0;

for (let i = 0; i < toInsert.length; i += BATCH) {
  const batch = toInsert.slice(i, i + BATCH);
  const { error: insertErr } = await supabase
    .from('staff')
    .insert(batch);

  if (insertErr) {
    console.error(`  ✗ Batch ${Math.floor(i / BATCH) + 1} failed: ${insertErr.message}`);
    errors++;
  } else {
    inserted += batch.length;
    console.log(`  ✓ Batch ${Math.floor(i / BATCH) + 1}: inserted ${batch.length} employees.`);
  }
}

console.log(`\n${SEP}`);
console.log(`  IMPORT COMPLETE`);
console.log(`${SEP}`);
console.log(`  Inserted:  ${inserted}`);
console.log(`  Skipped:   ${alreadyExist.length}`);
console.log(`  Errors:    ${errors}`);
console.log(`${SEP}\n`);
