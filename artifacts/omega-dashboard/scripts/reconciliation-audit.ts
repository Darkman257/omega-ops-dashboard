// ─── Attendance Reconciliation Audit ─────────────────────────────────────────
// Compares manual attendance summary (attendance table) against biometric
// machine logs (attendance_logs table) to detect discrepancies.
//
// Flags:
//   manual_present_no_biometric  → attendance=present, no biometric IN found
//   biometric_present_manual_absent → biometric IN found, attendance=absent
//   missing_out                  → biometric IN found, no biometric OUT
//   unknown_biometric_employee   → biometric employee_id not in staff table
//
// Read-only — no data is modified.
//
// Run:
//   pnpm --filter @workspace/omega-dashboard run reconcile -- 2026 4
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const args  = process.argv.slice(2).filter(a => a !== '--');
const year  = parseInt(args[0] ?? '2026', 10);
const month = parseInt(args[1] ?? '4',    10);

if (isNaN(year) || isNaN(month)) {
  console.error('\nUsage: reconcile <year> <month>\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Period bounds ────────────────────────────────────────────────────────────
const monthStr    = String(month).padStart(2, '0');
const periodStart = `${year}-${monthStr}-01`;
const daysInMonth = new Date(year, month, 0).getDate();
const periodEnd   = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

const SEP = '━'.repeat(60);

console.log(`\n${SEP}`);
console.log(`  OMEGA ATTENDANCE RECONCILIATION AUDIT`);
console.log(`  Period : ${year}/${monthStr}  (${periodStart} → ${periodEnd})`);
console.log(`  Time   : ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

console.log('  [1/4] Fetching staff...');
const { data: staffData } = await supabase.from('staff').select('internal_code, full_name');
const staffCodes = new Set((staffData ?? []).map((s: { internal_code: string }) => String(s.internal_code)));
const staffNames = new Map((staffData ?? []).map((s: { internal_code: string; full_name: string }) => [String(s.internal_code), s.full_name]));

console.log('  [2/4] Fetching attendance (manual)...');
const { data: manualData } = await supabase
  .from('attendance')
  .select('employee_id, employee_name, date, status')
  .gte('date', periodStart)
  .lte('date', periodEnd);

console.log('  [3/4] Fetching attendance_logs (biometric)...');
const { data: bioData } = await supabase
  .from('attendance_logs')
  .select('employee_id, employee_name, log_date, type')
  .gte('log_date', periodStart)
  .lte('log_date', periodEnd);

console.log('  [4/4] Running reconciliation...\n');

// ─── Build biometric lookup maps ──────────────────────────────────────────────
// Key format: `${employee_id}__${log_date}`
type BioEntry = { employee_id: string; employee_name: string; log_date: string; type: string };
type ManualEntry = { employee_id: string; employee_name: string; date: string; status: string };

const bioLogs = (bioData ?? []) as BioEntry[];
const manualLogs = (manualData ?? []) as ManualEntry[];

const bioInSet  = new Set<string>();   // has IN punch
const bioOutSet = new Set<string>();   // has OUT punch
const bioEmployees = new Set<string>(); // all biometric employee IDs

for (const log of bioLogs) {
  const key = `${log.employee_id}__${log.log_date}`;
  bioEmployees.add(log.employee_id);
  if (log.type === 'in')  bioInSet.add(key);
  if (log.type === 'out') bioOutSet.add(key);
}

// ─── Flag 1: manual_present_no_biometric ─────────────────────────────────────
type FlagRecord = { flag: string; employee_id: string; employee_name: string; date: string; detail: string };

const flag1: FlagRecord[] = [];
const flag2: FlagRecord[] = [];

for (const rec of manualLogs) {
  const key = `${rec.employee_id}__${rec.date}`;
  if (rec.status === 'present' && !bioInSet.has(key)) {
    flag1.push({
      flag:          'manual_present_no_biometric',
      employee_id:   rec.employee_id,
      employee_name: rec.employee_name ?? staffNames.get(rec.employee_id) ?? '?',
      date:          rec.date,
      detail:        `Manual=present, no biometric IN recorded`
    });
  }
  if (rec.status === 'absent' && bioInSet.has(key)) {
    flag2.push({
      flag:          'biometric_present_manual_absent',
      employee_id:   rec.employee_id,
      employee_name: rec.employee_name ?? staffNames.get(rec.employee_id) ?? '?',
      date:          rec.date,
      detail:        `Biometric=IN recorded, manual=absent`
    });
  }
}

// ─── Flag 3: missing_out ─────────────────────────────────────────────────────
const flag3: FlagRecord[] = [];
for (const key of bioInSet) {
  if (!bioOutSet.has(key)) {
    const [empId, date] = key.split('__');
    // Get name from biometric data
    const bioRec = bioLogs.find(l => l.employee_id === empId && l.log_date === date);
    flag3.push({
      flag:          'missing_out',
      employee_id:   empId,
      employee_name: bioRec?.employee_name ?? staffNames.get(empId) ?? '?',
      date:          date,
      detail:        `Biometric IN recorded, no OUT punch`
    });
  }
}

// ─── Flag 4: unknown_biometric_employee ──────────────────────────────────────
const flag4: FlagRecord[] = [];
const unknownIds = new Set<string>();
for (const empId of bioEmployees) {
  if (!staffCodes.has(empId) && !unknownIds.has(empId)) {
    unknownIds.add(empId);
    const bioRec = bioLogs.find(l => l.employee_id === empId);
    flag4.push({
      flag:          'unknown_biometric_employee',
      employee_id:   empId,
      employee_name: bioRec?.employee_name ?? '?',
      date:          bioRec?.log_date ?? '?',
      detail:        `Employee ID ${empId} not found in staff table`
    });
  }
}

// ─── Totals ───────────────────────────────────────────────────────────────────
const totalManualDays   = manualLogs.length;
const totalBiometricDays = bioInSet.size;
const matched = manualLogs.filter(r => {
  const key = `${r.employee_id}__${r.date}`;
  return (r.status === 'present' && bioInSet.has(key)) ||
         (r.status === 'absent'  && !bioInSet.has(key));
}).length;

// ─── All flags combined for top-10 suspicious ────────────────────────────────
const allFlags = [...flag2, ...flag1, ...flag3, ...flag4];

// ─── Print report ─────────────────────────────────────────────────────────────
console.log(`${SEP}`);
console.log(`  SUMMARY`);
console.log(`${SEP}`);
console.log(`  Manual attendance records:          ${totalManualDays}`);
console.log(`  Biometric IN records:               ${totalBiometricDays}`);
console.log(`  Matched days (status consistent):   ${matched}`);
console.log('');
console.log(`  ⚠  manual_present_no_biometric:     ${flag1.length}`);
console.log(`  🚨 biometric_present_manual_absent:  ${flag2.length}`);
console.log(`  ⚠  missing_out:                     ${flag3.length}`);
console.log(`  ❓ unknown_biometric_employee:       ${flag4.length}`);
console.log('');

// Flag 2 — highest priority
if (flag2.length > 0) {
  console.log(`${SEP}`);
  console.log(`  🚨 BIOMETRIC PRESENT / MANUAL ABSENT  (${flag2.length})`);
  console.log(`  These need immediate review — may indicate data entry errors or fraud.`);
  console.log(`${SEP}`);
  flag2.slice(0, 20).forEach(r => {
    console.log(`   [${r.date}] ${r.employee_id.padEnd(8)} ${r.employee_name}`);
  });
  if (flag2.length > 20) console.log(`   … and ${flag2.length - 20} more`);
  console.log('');
}

// Flag 1
if (flag1.length > 0) {
  console.log(`${SEP}`);
  console.log(`  ⚠  MANUAL PRESENT / NO BIOMETRIC  (${flag1.length})`);
  console.log(`  May indicate biometric machine was offline or employee skipped scan.`);
  console.log(`${SEP}`);
  flag1.slice(0, 20).forEach(r => {
    console.log(`   [${r.date}] ${r.employee_id.padEnd(8)} ${r.employee_name}`);
  });
  if (flag1.length > 20) console.log(`   … and ${flag1.length - 20} more`);
  console.log('');
}

// Flag 3
if (flag3.length > 0) {
  console.log(`${SEP}`);
  console.log(`  ⚠  MISSING OUT PUNCH  (${flag3.length})`);
  console.log(`  Biometric IN recorded but no OUT — hours cannot be calculated.`);
  console.log(`${SEP}`);
  flag3.slice(0, 20).forEach(r => {
    console.log(`   [${r.date}] ${r.employee_id.padEnd(8)} ${r.employee_name}`);
  });
  if (flag3.length > 20) console.log(`   … and ${flag3.length - 20} more`);
  console.log('');
}

// Flag 4
if (flag4.length > 0) {
  console.log(`${SEP}`);
  console.log(`  ❓ UNKNOWN BIOMETRIC EMPLOYEES  (${flag4.length})`);
  console.log(`  Employee IDs in biometric logs not found in staff table.`);
  console.log(`${SEP}`);
  flag4.forEach(r => {
    console.log(`   ID: ${r.employee_id.padEnd(10)} Name: ${r.employee_name}`);
  });
  console.log('');
}

// Top 10 suspicious
console.log(`${SEP}`);
console.log(`  TOP 10 SUSPICIOUS RECORDS (priority order)`);
console.log(`${SEP}`);
allFlags.slice(0, 10).forEach((r, i) => {
  console.log(`  ${String(i + 1).padStart(2)}. [${r.flag}]`);
  console.log(`      Employee: ${r.employee_id} — ${r.employee_name}`);
  console.log(`      Date:     ${r.date}`);
  console.log(`      Detail:   ${r.detail}`);
});

console.log(`\n${SEP}`);
console.log(`  ✓ Audit complete. No data was modified.`);
console.log(`${SEP}\n`);
