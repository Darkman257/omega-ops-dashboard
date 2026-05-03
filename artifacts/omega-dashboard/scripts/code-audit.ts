// ─── Employee Code Audit ──────────────────────────────────────────────────────
// Cross-references employee codes between:
//   1. Staff table (Supabase) → internal_code
//   2. Payroll sheet (CSV)    → employee_id (col 1)
//   3. Attendance table       → employee_id
//   4. Biometric logs         → employee_id
//
// Purpose: prove whether code sets overlap or are disjoint.
//
// Usage:
//   pnpm --filter @workspace/omega-dashboard run code-audit -- 2026 4
//
// Does NOT modify any data.
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const rawArgs     = process.argv.slice(2).filter(a => a !== '--');
const positional  = rawArgs.filter(a => !a.startsWith('--'));
const year        = parseInt(positional[0] ?? '2026', 10);
const month       = parseInt(positional[1] ?? '4',    10);
const payrollIdx  = rawArgs.indexOf('--payroll');
const payrollFile = payrollIdx !== -1 ? rawArgs[payrollIdx + 1] : './data/april-rates.csv';
const monthStr    = String(month).padStart(2, '0');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SEP      = '━'.repeat(90);
const THIN     = '─'.repeat(88);

function num(val: string | undefined): number {
  if (!val) return 0;
  const n = Number(val.trim().replace(/[^\d.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

console.log(`\n${SEP}`);
console.log(`  OMEGA EMPLOYEE CODE AUDIT`);
console.log(`  Period:  ${year}/${monthStr}`);
console.log(`  Payroll: ${payrollFile}`);
console.log(`  Time:    ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

// ─── 1. Staff table ───────────────────────────────────────────────────────────
console.log(`  [1/4] Fetching staff table...`);
const { data: staffData, error: staffErr } = await supabase
  .from('staff')
  .select('internal_code, full_name')
  .order('internal_code');

if (staffErr) { console.error(`  ✗ ${staffErr.message}`); process.exit(1); }

const staffCodes = new Map<string, string>();
for (const s of staffData ?? []) {
  const code = String(s.internal_code ?? '').trim();
  if (code) staffCodes.set(code, s.full_name ?? '');
}

// ─── 2. Payroll sheet ─────────────────────────────────────────────────────────
console.log(`  [2/4] Parsing payroll sheet...`);
const payrollCodes = new Map<string, { name: string; salary: number }>();
if (fs.existsSync(payrollFile)) {
  const raw   = fs.readFileSync(payrollFile, 'utf-8');
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols   = line.split(',');
    const code   = cols[1]?.trim() ?? '';
    if (!code || isNaN(Number(code))) continue;
    const name   = cols[4]?.trim() ?? '';
    const salary = num(cols[83]);
    if (!name && salary <= 0) continue;
    payrollCodes.set(code, { name, salary });
  }
}

// ─── 3. Attendance table ──────────────────────────────────────────────────────
console.log(`  [3/4] Fetching attendance codes...`);
const daysInMonth = new Date(year, month, 0).getDate();
const { data: attData } = await supabase
  .from('attendance')
  .select('employee_id, employee_name')
  .gte('date', `${year}-${monthStr}-01`)
  .lte('date', `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`);

const attCodes = new Map<string, string>();
for (const r of (attData ?? []) as Array<{ employee_id: string; employee_name: string }>) {
  if (!attCodes.has(r.employee_id)) attCodes.set(r.employee_id, r.employee_name ?? '');
}

// ─── 4. Biometric logs ───────────────────────────────────────────────────────
console.log(`  [4/4] Fetching biometric log codes...`);
const { data: bioData } = await supabase
  .from('attendance_logs')
  .select('employee_id, employee_name');

const bioCodes = new Map<string, string>();
for (const r of (bioData ?? []) as Array<{ employee_id: string; employee_name: string }>) {
  if (!bioCodes.has(r.employee_id)) bioCodes.set(r.employee_id, r.employee_name ?? '');
}

// ─── Print each source ────────────────────────────────────────────────────────
console.log(`\n${SEP}`);
console.log(`  SOURCE 1: STAFF TABLE (${staffCodes.size} employees)`);
console.log(`${SEP}`);
console.log(`  ${'Code'.padEnd(10)}Name`);
console.log(`  ${THIN}`);
for (const [code, name] of [...staffCodes.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
  console.log(`  ${code.padEnd(10)}${name}`);
}

console.log(`\n${SEP}`);
console.log(`  SOURCE 2: PAYROLL SHEET (${payrollCodes.size} employees)`);
console.log(`${SEP}`);
console.log(`  ${'Code'.padEnd(10)}${'Name'.padEnd(30)}${'Salary'.padStart(10)}`);
console.log(`  ${THIN}`);
for (const [code, data] of [...payrollCodes.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
  console.log(`  ${code.padEnd(10)}${data.name.slice(0, 28).padEnd(30)}${data.salary.toFixed(0).padStart(10)}`);
}

console.log(`\n${SEP}`);
console.log(`  SOURCE 3: ATTENDANCE TABLE (${attCodes.size} unique codes for ${year}/${monthStr})`);
console.log(`${SEP}`);
console.log(`  ${'Code'.padEnd(10)}Name`);
console.log(`  ${THIN}`);
for (const [code, name] of [...attCodes.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
  console.log(`  ${code.padEnd(10)}${name}`);
}

console.log(`\n${SEP}`);
console.log(`  SOURCE 4: BIOMETRIC LOGS (${bioCodes.size} unique codes)`);
console.log(`${SEP}`);
console.log(`  ${'Code'.padEnd(10)}Name`);
console.log(`  ${THIN}`);
for (const [code, name] of [...bioCodes.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
  console.log(`  ${code.padEnd(10)}${name}`);
}

// ─── Cross-reference ──────────────────────────────────────────────────────────
const allCodes = new Set([...staffCodes.keys(), ...payrollCodes.keys(), ...attCodes.keys(), ...bioCodes.keys()]);

// Match results
const matchedStaffPayroll    = [...staffCodes.keys()].filter(c => payrollCodes.has(c));
const payrollNotInStaff      = [...payrollCodes.keys()].filter(c => !staffCodes.has(c));
const staffNotInPayroll      = [...staffCodes.keys()].filter(c => !payrollCodes.has(c));
const matchedStaffAttendance = [...staffCodes.keys()].filter(c => attCodes.has(c));
const attNotInStaff          = [...attCodes.keys()].filter(c => !staffCodes.has(c));
const matchedStaffBio        = [...staffCodes.keys()].filter(c => bioCodes.has(c));
const bioNotInStaff          = [...bioCodes.keys()].filter(c => !staffCodes.has(c));

console.log(`\n${SEP}`);
console.log(`  CROSS-REFERENCE RESULTS`);
console.log(`${SEP}`);
console.log(`  Total unique codes across all sources: ${allCodes.size}\n`);

console.log(`  Staff ↔ Payroll Sheet:`);
console.log(`    ✅ Matched:              ${matchedStaffPayroll.length}`);
console.log(`    ❌ In payroll, NOT staff: ${payrollNotInStaff.length}`);
console.log(`    📭 In staff, NOT payroll: ${staffNotInPayroll.length}`);

if (matchedStaffPayroll.length > 0) {
  console.log(`    Matched codes: ${matchedStaffPayroll.sort((a, b) => Number(a) - Number(b)).join(', ')}`);
}
if (payrollNotInStaff.length > 0) {
  console.log(`    Missing from staff: ${payrollNotInStaff.sort((a, b) => Number(a) - Number(b)).join(', ')}`);
}
if (staffNotInPayroll.length > 0) {
  console.log(`    Missing from payroll: ${staffNotInPayroll.sort((a, b) => Number(a) - Number(b)).join(', ')}`);
}

console.log(`\n  Staff ↔ Attendance Table:`);
console.log(`    ✅ Matched:                  ${matchedStaffAttendance.length}`);
console.log(`    ❌ In attendance, NOT staff:  ${attNotInStaff.length}`);
if (attNotInStaff.length > 0) {
  console.log(`    Missing from staff: ${attNotInStaff.sort((a, b) => Number(a) - Number(b)).join(', ')}`);
}

console.log(`\n  Staff ↔ Biometric Logs:`);
console.log(`    ✅ Matched:                ${matchedStaffBio.length}`);
console.log(`    ❌ In biometric, NOT staff: ${bioNotInStaff.length}  (PENDING REVIEW)`);
if (bioNotInStaff.length > 0) {
  console.log(`    Pending review codes: ${bioNotInStaff.sort((a, b) => Number(a) - Number(b)).join(', ')}`);
  console.log(`    ℹ️  Note: Biometric code exists but not confirmed in staff/payroll. These may be new workers or temporary labor.`);
}

// ─── Diagnosis ────────────────────────────────────────────────────────────────
console.log(`\n${SEP}`);
console.log(`  DIAGNOSIS`);
console.log(`${SEP}`);

if (matchedStaffPayroll.length === 0 && payrollCodes.size > 0 && staffCodes.size > 0) {
  console.log(`  🚨 ZERO OVERLAP between staff table and payroll sheet!`);
  console.log(`     Staff uses ${[...staffCodes.keys()].sort((a, b) => Number(a) - Number(b))[0]}–${[...staffCodes.keys()].sort((a, b) => Number(a) - Number(b)).pop()} range`);
  console.log(`     Payroll uses ${[...payrollCodes.keys()].sort((a, b) => Number(a) - Number(b))[0]}–${[...payrollCodes.keys()].sort((a, b) => Number(a) - Number(b)).pop()} range`);
  console.log(`     → These are DIFFERENT employee groups (different sites/crews).`);
  console.log(`     → To validate, either:`);
  console.log(`       1. Import Obsidier crew (2xxx) into staff table`);
  console.log(`       2. Upload Main Omega (1xxx) payroll sheet`);
} else if (matchedStaffPayroll.length > 0) {
  const matchPct = Math.round((matchedStaffPayroll.length / Math.max(staffCodes.size, payrollCodes.size)) * 100);
  console.log(`  ✅ ${matchedStaffPayroll.length} codes matched (${matchPct}% overlap).`);
  if (payrollNotInStaff.length > 0) {
    console.log(`  ⚠ ${payrollNotInStaff.length} payroll employees need to be added to staff table.`);
  }
}

console.log(`\n${SEP}`);
console.log(`  ✓ Code audit complete. No data was modified.`);
console.log(`${SEP}\n`);
