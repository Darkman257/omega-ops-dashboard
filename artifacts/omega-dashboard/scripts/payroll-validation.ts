// ─── Payroll Validation Engine ────────────────────────────────────────────────
// Compares system-calculated payroll (from attendance table) against actual
// payroll values extracted from the real wages sheet CSV.
//
// This is a validation-only tool — NO data is written to DB.
//
// Usage:
//   pnpm --filter @workspace/omega-dashboard run payroll-validation -- 2026 4
//
// Payroll sheet expected at: ./data/april-rates.csv (Obsidier Tower wages CSV)
//
// Column layout from wages sheet (row 3 header):
//   Col 1:  الكود            → employee_id
//   Col 4:  الاسم            → employee_name
//   Col 5:  المهنة           → job_title
//   Col 6:  فئة الأجر        → daily_rate
//   Col 39: ايام العمل الفعلية → actual_work_days
//   Col 40: الايام المرضى     → sick_days
//   Col 41: مجموع الايام      → total_days
//   Col 73: الوقت الاضافى     → ot_hours
//   Col 75: الخصم             → deductions
//   Col 76: قيمة ايام العمل   → work_value
//   Col 79: قيمة الوقت الاضافى → ot_value
//   Col 80: المبلغ الكلى      → gross_total
//   Col 82: صافى الاجر        → net_salary
//   Col 83: الاجر بعد التقريب  → actual_salary (rounded final)
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const rawArgs    = process.argv.slice(2).filter(a => a !== '--');
const positional = rawArgs.filter(a => !a.startsWith('--'));
const year       = parseInt(positional[0] ?? '2026', 10);
const month      = parseInt(positional[1] ?? '4',    10);

// Payroll sheet path
const payrollIdx  = rawArgs.indexOf('--payroll');
const payrollFile = payrollIdx !== -1
  ? rawArgs[payrollIdx + 1]
  : './data/april-rates.csv';

if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
  console.error('\nUsage: payroll-validation <year> <month> [--payroll <csv>]\n');
  process.exit(1);
}

// ─── Payroll sheet column indexes ─────────────────────────────────────────────
const COL = {
  CODE:          1,
  NAME:          4,
  JOB:           5,
  DAILY_RATE:    6,
  WORK_DAYS:     39,
  SICK_DAYS:     40,
  TOTAL_DAYS:    41,
  OT_HOURS:      73,
  DEDUCT_HOURS:  74,
  DEDUCTION:     75,
  WORK_VALUE:    76,
  SICK_VALUE:    77,
  AREA_ALLOW:    78,
  OT_VALUE:      79,
  GROSS:         80,
  TAX:           81,
  NET_SALARY:    82,
  ACTUAL_SALARY: 83,  // الاجر بعد التقريب — the rounded final
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface PayrollSheetRow {
  employee_id: string;
  employee_name: string;
  job_title: string;
  daily_rate: number;
  actual_work_days: number;
  sick_days: number;
  total_days: number;
  ot_hours: number;
  deductions: number;
  work_value: number;
  ot_value: number;
  gross_total: number;
  net_salary: number;
  actual_salary: number;
}

interface ValidationRow {
  employee_id: string;
  employee_name: string;
  // System side
  sys_payable_days: number;
  sys_daily_rate: number;
  sys_estimated: number;
  // Actual side
  act_work_days: number;
  act_daily_rate: number;
  act_ot_value: number;
  act_deductions: number;
  act_gross: number;
  act_salary: number;
  // Comparison
  day_diff: number;
  salary_diff: number;
  diff_percent: number;
  flag: 'OK' | 'WARNING' | 'CRITICAL' | 'NO_SYSTEM_DATA' | 'NO_ACTUAL_DATA';
}

// ─── Payroll statuses (same as training report) ──────────────────────────────
const PAYABLE_STATUSES = new Set([
  'present', 'offsite', 'night_shift', 'sick',
  'rest_day', 'compensatory', 'permitted_leave'
]);

// ─── Parse payroll sheet ──────────────────────────────────────────────────────
function parsePayrollSheet(filePath: string): Map<string, PayrollSheetRow> {
  const map = new Map<string, PayrollSheetRow>();
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = line.split(',');
    const code = cols[COL.CODE]?.trim() ?? '';

    // Skip non-data rows (headers, empty codes, non-numeric)
    if (!code || isNaN(Number(code))) continue;

    // Skip empty employee rows (no name + salary = 0)
    const name = cols[COL.NAME]?.trim() ?? '';
    const actualSalary = parseNum(cols[COL.ACTUAL_SALARY]);
    if (!name && actualSalary <= 0) continue;

    map.set(code, {
      employee_id:      code,
      employee_name:    name,
      job_title:        cols[COL.JOB]?.trim() ?? '',
      daily_rate:       parseNum(cols[COL.DAILY_RATE]),
      actual_work_days: parseNum(cols[COL.WORK_DAYS]),
      sick_days:        parseNum(cols[COL.SICK_DAYS]),
      total_days:       parseNum(cols[COL.TOTAL_DAYS]),
      ot_hours:         parseNum(cols[COL.OT_HOURS]),
      deductions:       parseNum(cols[COL.DEDUCTION]),
      work_value:       parseNum(cols[COL.WORK_VALUE]),
      ot_value:         parseNum(cols[COL.OT_VALUE]),
      gross_total:      parseNum(cols[COL.GROSS]),
      net_salary:       parseNum(cols[COL.NET_SALARY]),
      actual_salary:    actualSalary,
    });
  }

  return map;
}

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.trim().replace(/[^\d.\-]/g, '');
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const supabase    = createClient(SUPABASE_URL, SUPABASE_KEY);
const monthStr    = String(month).padStart(2, '0');
const daysInMonth = new Date(year, month, 0).getDate();
const periodStart = `${year}-${monthStr}-01`;
const periodEnd   = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

const SEP = '━'.repeat(100);

console.log(`\n${SEP}`);
console.log(`  OMEGA PAYROLL VALIDATION ENGINE`);
console.log(`  Reference month: ${year}/${monthStr}  (${periodStart} → ${periodEnd})`);
console.log(`  Payroll sheet:   ${payrollFile}`);
console.log(`  Mode:            VALIDATION ONLY — no DB writes`);
console.log(`  Time:            ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

// Step 1: Load payroll sheet
if (!fs.existsSync(payrollFile)) {
  console.error(`  ✗ Payroll file not found: ${payrollFile}`);
  process.exit(1);
}
const payrollMap = parsePayrollSheet(payrollFile);
console.log(`  [1/3] Parsed ${payrollMap.size} employees from payroll sheet.`);

// Step 2: Fetch system attendance
console.log(`  [2/3] Fetching attendance from Supabase...`);
const { data: attendanceData, error: attErr } = await supabase
  .from('attendance')
  .select('employee_id, employee_name, date, status')
  .gte('date', periodStart)
  .lte('date', periodEnd);

if (attErr) {
  console.error(`  ✗ Attendance fetch failed: ${attErr.message}`);
  process.exit(1);
}

type AttRow = { employee_id: string; employee_name: string; date: string; status: string };
const attRows = (attendanceData ?? []) as AttRow[];

// Group by employee → count payable days
const sysMap = new Map<string, { name: string; payable: number; present: number; absent: number }>();
for (const row of attRows) {
  if (!sysMap.has(row.employee_id)) {
    sysMap.set(row.employee_id, { name: row.employee_name, payable: 0, present: 0, absent: 0 });
  }
  const emp = sysMap.get(row.employee_id)!;
  if (PAYABLE_STATUSES.has(row.status)) {
    emp.payable++;
  }
  if (row.status === 'present') emp.present++;
  if (row.status === 'absent' || row.status === 'excused_absence') emp.absent++;
}

console.log(`  [3/3] Running validation...\n`);

// Step 3: Build comparison
const allCodes = new Set([...payrollMap.keys(), ...sysMap.keys()]);
const results: ValidationRow[] = [];

for (const code of allCodes) {
  const actual = payrollMap.get(code);
  const sys    = sysMap.get(code);

  const actRate    = actual?.daily_rate ?? 0;
  const sysRate    = actRate;  // use actual rate for system estimate (fair comparison)
  const sysDays    = sys?.payable ?? 0;
  const actDays    = actual?.actual_work_days ?? 0;
  const sysEstimate = sysRate * sysDays;
  const actSalary  = actual?.actual_salary ?? 0;

  const salaryDiff = actSalary - sysEstimate;
  const diffPct    = sysEstimate > 0
    ? Math.abs(salaryDiff / sysEstimate) * 100
    : (actSalary > 0 ? 100 : 0);

  let flag: ValidationRow['flag'];
  if (!sys)    flag = 'NO_SYSTEM_DATA';
  else if (!actual || actSalary <= 0) flag = 'NO_ACTUAL_DATA';
  else if (diffPct <= 5)   flag = 'OK';
  else if (diffPct <= 15)  flag = 'WARNING';
  else                     flag = 'CRITICAL';

  results.push({
    employee_id:     code,
    employee_name:   actual?.employee_name ?? sys?.name ?? '?',
    sys_payable_days: sysDays,
    sys_daily_rate:  sysRate,
    sys_estimated:   Math.round(sysEstimate * 100) / 100,
    act_work_days:   actDays,
    act_daily_rate:  actRate,
    act_ot_value:    actual?.ot_value ?? 0,
    act_deductions:  actual?.deductions ?? 0,
    act_gross:       actual?.gross_total ?? 0,
    act_salary:      actSalary,
    day_diff:        actDays - sysDays,
    salary_diff:     Math.round(salaryDiff * 100) / 100,
    diff_percent:    Math.round(diffPct * 100) / 100,
    flag,
  });
}

// Sort by flag severity, then diff %
const flagOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, NO_SYSTEM_DATA: 2, NO_ACTUAL_DATA: 3, OK: 4 };
results.sort((a, b) => {
  const fa = flagOrder[a.flag] ?? 5;
  const fb = flagOrder[b.flag] ?? 5;
  if (fa !== fb) return fa - fb;
  return b.diff_percent - a.diff_percent;
});

// ─── Print comparison table ───────────────────────────────────────────────────
console.log(`${SEP}`);
console.log(`  PAYROLL COMPARISON TABLE`);
console.log(`${SEP}`);

const header =
  '  Code'.padEnd(9) +
  'Name'.padEnd(26) +
  'SysDy'.padStart(6) +
  'ActDy'.padStart(6) +
  'DDif'.padStart(5) +
  'Rate'.padStart(8) +
  'SysEst'.padStart(11) +
  'ActSal'.padStart(11) +
  'Diff'.padStart(11) +
  'Diff%'.padStart(8) +
  '  Flag';

console.log(header);
console.log('  ' + '─'.repeat(header.length - 2));

for (const r of results) {
  // Skip rows with no data on both sides
  if (r.sys_payable_days === 0 && r.act_salary <= 0) continue;

  const flagIcon =
    r.flag === 'OK' ? '✅' :
    r.flag === 'WARNING' ? '⚠️ ' :
    r.flag === 'CRITICAL' ? '🚨' :
    r.flag === 'NO_SYSTEM_DATA' ? '❓' : '📭';

  const line =
    `  ${r.employee_id.padEnd(7)}` +
    r.employee_name.slice(0, 24).padEnd(26) +
    String(r.sys_payable_days).padStart(6) +
    String(r.act_work_days).padStart(6) +
    (r.day_diff > 0 ? `+${r.day_diff}` : String(r.day_diff)).padStart(5) +
    r.act_daily_rate.toFixed(0).padStart(8) +
    r.sys_estimated.toFixed(0).padStart(11) +
    r.act_salary.toFixed(0).padStart(11) +
    (r.salary_diff >= 0 ? `+${r.salary_diff.toFixed(0)}` : r.salary_diff.toFixed(0)).padStart(11) +
    `${r.diff_percent.toFixed(1)}%`.padStart(8) +
    `  ${flagIcon} ${r.flag}`;

  console.log(line);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const withBothSides = results.filter(r => r.sys_payable_days > 0 && r.act_salary > 0);
const totalSysPayroll  = withBothSides.reduce((s, r) => s + r.sys_estimated, 0);
const totalActPayroll  = withBothSides.reduce((s, r) => s + r.act_salary, 0);
const totalDiff        = totalActPayroll - totalSysPayroll;
const avgErrorPct      = withBothSides.length > 0
  ? withBothSides.reduce((s, r) => s + r.diff_percent, 0) / withBothSides.length
  : 0;

const okCount       = results.filter(r => r.flag === 'OK').length;
const warnCount     = results.filter(r => r.flag === 'WARNING').length;
const critCount     = results.filter(r => r.flag === 'CRITICAL').length;
const noSysCount    = results.filter(r => r.flag === 'NO_SYSTEM_DATA').length;
const noActCount    = results.filter(r => r.flag === 'NO_ACTUAL_DATA').length;

console.log(`\n${SEP}`);
console.log(`  VALIDATION SUMMARY`);
console.log(`${SEP}`);
console.log(`  Employees matched:        ${withBothSides.length}`);
console.log(`  Total system payroll:     ${totalSysPayroll.toFixed(2)}`);
console.log(`  Total actual payroll:     ${totalActPayroll.toFixed(2)}`);
console.log(`  Total difference:         ${totalDiff >= 0 ? '+' : ''}${totalDiff.toFixed(2)}`);
console.log(`  Average error %:          ${avgErrorPct.toFixed(2)}%`);
console.log('');
console.log(`  ✅ OK       (<5%):       ${okCount}`);
console.log(`  ⚠️  WARNING  (5–15%):     ${warnCount}`);
console.log(`  🚨 CRITICAL (>15%):      ${critCount}`);
console.log(`  ❓ No system data:       ${noSysCount}`);
console.log(`  📭 No actual data:       ${noActCount}`);

// Top 10 mismatches
const topMismatch = withBothSides
  .filter(r => r.flag !== 'OK')
  .sort((a, b) => b.diff_percent - a.diff_percent)
  .slice(0, 10);

if (topMismatch.length > 0) {
  console.log(`\n  TOP 10 MISMATCHES:`);
  topMismatch.forEach((r, i) => {
    console.log(
      `   ${String(i + 1).padStart(2)}. [${r.flag}] ${r.employee_id.padEnd(8)} ${r.employee_name.slice(0, 24).padEnd(26)}` +
      `sys: ${r.sys_estimated.toFixed(0).padStart(8)}  act: ${r.act_salary.toFixed(0).padStart(8)}` +
      `  diff: ${r.salary_diff >= 0 ? '+' : ''}${r.salary_diff.toFixed(0).padStart(8)}  (${r.diff_percent.toFixed(1)}%)`
    );
  });
}

// Explain systematic difference
if (totalDiff > 0) {
  console.log(`\n  💡 ANALYSIS: Actual payroll exceeds system estimate by ${totalDiff.toFixed(0)}.`);
  console.log(`     This is expected — the system does NOT yet account for:`);
  console.log(`       • Overtime (OT) — total OT value in sheet`);
  console.log(`       • Area allowances (بدل المنطقة)`);
  console.log(`       • Deductions (خصومات)`);
  console.log(`     These components explain the systematic positive difference.`);
}

console.log(`\n${SEP}`);
console.log(`  ✓ Validation complete. No data was modified.`);
console.log(`  Reference: ${year}/${monthStr} | Sheet: ${payrollFile}`);
console.log(`${SEP}\n`);
