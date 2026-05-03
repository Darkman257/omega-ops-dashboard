// ─── Obsidier Tower Payroll Reference Report ─────────────────────────────────
// Self-contained training report using the Obsidier Tower wages sheet.
// Extracts both attendance and payroll from the same sheet — no Supabase needed.
//
// Internal validation formula:
//   base_pay   = daily_rate × work_days
//   expected   = base_pay + ot_value + area_allowance + sick_value - deductions
//   actual     = الاجر بعد التقريب (col 83)
//   variance   = actual - expected
//
// Usage:
//   pnpm --filter @workspace/omega-dashboard run obsidier-training -- 2026 4
//   pnpm --filter @workspace/omega-dashboard run obsidier-training -- 2026 4 --payroll ./data/other.csv
//
// Does NOT mix with 1xxx Main Omega data.
// Does NOT write to DB.
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';

// ─── Column indexes from Obsidier Tower wages sheet ──────────────────────────
const COL = {
  SERIAL:        0,   // م
  CODE:          1,   // الكود
  NATIONAL_ID:   2,   // الرقم القومي
  MEEZA:         3,   // كود كارت ميزا
  NAME:          4,   // الاسم
  JOB:           5,   // المهنة
  DAILY_RATE:    6,   // فئة الأجر
  OT_EXCEPTION:  7,   // Exception Over Time Or Not
  // Cols 8–38: daily attendance cells
  WORK_DAYS:     39,  // ايام العمل الفعلية
  SICK_DAYS:     40,  // الايام المرضى
  TOTAL_DAYS:    41,  // مجموع الايام
  // Cols 42–72: daily OT hours
  OT_HOURS:      73,  // الوقت الاضافى بالساعة
  DEDUCT_HOURS:  74,  // الخصم بالساعه
  DEDUCTION:     75,  // الخصم
  WORK_VALUE:    76,  // قيمة ايام العمل الفعلية
  SICK_VALUE:    77,  // قيمة الايام المرضى
  AREA_ALLOW:    78,  // قيمة بدل المنطقة
  OT_VALUE:      79,  // قيمة الوقت الاضافى
  GROSS:         80,  // المبلغ الكلى
  TAX:           81,  // الضرائب
  NET_SALARY:    82,  // صافى الاجر
  ACTUAL_SALARY: 83,  // الاجر بعد التقريب (rounded final)
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ObsidierEmployee {
  serial: number;
  employee_id: string;
  employee_name: string;
  national_id: string;
  job_title: string;
  daily_rate: number;
  ot_exception: string;
  // Attendance
  work_days: number;
  sick_days: number;
  total_days: number;
  // Financials
  ot_hours: number;
  deduct_hours: number;
  deduction_amount: number;
  work_value: number;
  sick_value: number;
  area_allowance: number;
  ot_value: number;
  gross_total: number;
  tax: number;
  net_salary: number;
  actual_salary: number;
  // Calculated
  base_pay: number;
  expected_total: number;
  variance: number;
  variance_pct: number;
  flag: 'OK' | 'WARNING' | 'CRITICAL';
}

// ─── Args ─────────────────────────────────────────────────────────────────────
const rawArgs    = process.argv.slice(2).filter(a => a !== '--');
const positional = rawArgs.filter(a => !a.startsWith('--'));
const year       = parseInt(positional[0] ?? '2026', 10);
const month      = parseInt(positional[1] ?? '4',    10);

const payrollIdx  = rawArgs.indexOf('--payroll');
const payrollFile = payrollIdx !== -1
  ? rawArgs[payrollIdx + 1]
  : './data/april-rates.csv';

if (isNaN(year) || isNaN(month)) {
  console.error('\nUsage: obsidier-training <year> <month> [--payroll <csv>]\n');
  process.exit(1);
}

// ─── Parse helper ─────────────────────────────────────────────────────────────
function num(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.trim().replace(/[^\d.\-]/g, '');
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

// ─── Parse payroll sheet ──────────────────────────────────────────────────────
function parseObsidierSheet(filePath: string): ObsidierEmployee[] {
  const results: ObsidierEmployee[] = [];
  const raw   = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split(',');

    const code = cols[COL.CODE]?.trim() ?? '';
    if (!code || isNaN(Number(code))) continue;

    const name          = cols[COL.NAME]?.trim() ?? '';
    const actualSalary  = num(cols[COL.ACTUAL_SALARY]);

    // Skip empty placeholder rows (no name and salary ≤ 0)
    if (!name && actualSalary <= 0) continue;

    const dailyRate   = num(cols[COL.DAILY_RATE]);
    const workDays    = num(cols[COL.WORK_DAYS]);
    const sickDays    = num(cols[COL.SICK_DAYS]);
    const totalDays   = num(cols[COL.TOTAL_DAYS]);
    const otHours     = num(cols[COL.OT_HOURS]);
    const deductHours = num(cols[COL.DEDUCT_HOURS]);
    const deduction   = num(cols[COL.DEDUCTION]);
    const workValue   = num(cols[COL.WORK_VALUE]);
    const sickValue   = num(cols[COL.SICK_VALUE]);
    const areaAllow   = num(cols[COL.AREA_ALLOW]);
    const otValue     = num(cols[COL.OT_VALUE]);
    const gross       = num(cols[COL.GROSS]);
    const tax         = num(cols[COL.TAX]);
    const netSalary   = num(cols[COL.NET_SALARY]);

    // Internal validation
    const basePay       = dailyRate * workDays;
    const expectedTotal = workValue + sickValue + areaAllow + otValue - deduction;
    const variance      = actualSalary - expectedTotal;
    const variancePct   = expectedTotal > 0
      ? Math.abs(variance / expectedTotal) * 100
      : (actualSalary > 0 ? 100 : 0);

    let flag: 'OK' | 'WARNING' | 'CRITICAL';
    if (variancePct <= 1)       flag = 'OK';
    else if (variancePct <= 5)  flag = 'WARNING';
    else                        flag = 'CRITICAL';

    results.push({
      serial:           num(cols[COL.SERIAL]),
      employee_id:      code,
      employee_name:    name,
      national_id:      cols[COL.NATIONAL_ID]?.trim() ?? '',
      job_title:        cols[COL.JOB]?.trim() ?? '',
      daily_rate:       dailyRate,
      ot_exception:     cols[COL.OT_EXCEPTION]?.trim() ?? '',
      work_days:        workDays,
      sick_days:        sickDays,
      total_days:       totalDays,
      ot_hours:         otHours,
      deduct_hours:     deductHours,
      deduction_amount: deduction,
      work_value:       workValue,
      sick_value:       sickValue,
      area_allowance:   areaAllow,
      ot_value:         otValue,
      gross_total:      gross,
      tax,
      net_salary:       netSalary,
      actual_salary:    actualSalary,
      base_pay:         Math.round(basePay * 100) / 100,
      expected_total:   Math.round(expectedTotal * 100) / 100,
      variance:         Math.round(variance * 100) / 100,
      variance_pct:     Math.round(variancePct * 100) / 100,
      flag,
    });
  }

  return results;
}

// ─── Run ──────────────────────────────────────────────────────────────────────
const monthStr = String(month).padStart(2, '0');
const SEP      = '━'.repeat(120);
const THIN     = '─'.repeat(118);

console.log(`\n${SEP}`);
console.log(`  OBSIDIER TOWER — PAYROLL TRAINING REPORT`);
console.log(`  Reference month: ${year}/${monthStr}`);
console.log(`  Payroll sheet:   ${payrollFile}`);
console.log(`  Mode:            SELF-CONTAINED REFERENCE — no Supabase, no DB writes`);
console.log(`  Time:            ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

if (!fs.existsSync(payrollFile)) {
  console.error(`  ✗ File not found: ${payrollFile}`);
  process.exit(1);
}

const employees = parseObsidierSheet(payrollFile);
console.log(`  Parsed ${employees.length} employees from payroll sheet.\n`);

// ─── Attendance breakdown table ───────────────────────────────────────────────
console.log(`${SEP}`);
console.log(`  SECTION 1: ATTENDANCE BREAKDOWN (from sheet)`);
console.log(`${SEP}`);

const attHeader =
  '  #'.padEnd(5) +
  'Code'.padEnd(7) +
  'Name'.padEnd(26) +
  'Job'.padEnd(20) +
  'Rate'.padStart(7) +
  'Work'.padStart(6) +
  'Sick'.padStart(6) +
  'Total'.padStart(6) +
  'OT-hr'.padStart(7);

console.log(attHeader);
console.log(`  ${THIN}`);

for (const e of employees) {
  console.log(
    `  ${String(e.serial).padEnd(4)}` +
    `${e.employee_id.padEnd(6)} ` +
    `${e.employee_name.slice(0, 24).padEnd(26)}` +
    `${e.job_title.slice(0, 18).padEnd(20)}` +
    `${e.daily_rate.toFixed(0).padStart(7)}` +
    `${String(e.work_days).padStart(6)}` +
    `${String(e.sick_days).padStart(6)}` +
    `${String(e.total_days).padStart(6)}` +
    `${e.ot_hours.toFixed(0).padStart(7)}`
  );
}

// ─── Payroll breakdown table ──────────────────────────────────────────────────
console.log(`\n${SEP}`);
console.log(`  SECTION 2: PAYROLL BREAKDOWN`);
console.log(`${SEP}`);

const payHeader =
  '  Code'.padEnd(9) +
  'Name'.padEnd(26) +
  'BasePay'.padStart(10) +
  'OT'.padStart(10) +
  'Area'.padStart(8) +
  'Sick'.padStart(8) +
  'Deduct'.padStart(8) +
  'Gross'.padStart(10) +
  'Tax'.padStart(6) +
  'Actual'.padStart(10) +
  '  Flag';

console.log(payHeader);
console.log(`  ${THIN}`);

for (const e of employees) {
  console.log(
    `  ${e.employee_id.padEnd(7)} ` +
    `${e.employee_name.slice(0, 24).padEnd(26)}` +
    `${e.work_value.toFixed(0).padStart(10)}` +
    `${e.ot_value.toFixed(0).padStart(10)}` +
    `${e.area_allowance.toFixed(0).padStart(8)}` +
    `${e.sick_value.toFixed(0).padStart(8)}` +
    `${(e.deduction_amount > 0 ? `-${e.deduction_amount.toFixed(0)}` : '0').padStart(8)}` +
    `${e.gross_total.toFixed(0).padStart(10)}` +
    `${e.tax.toFixed(1).padStart(6)}` +
    `${e.actual_salary.toFixed(0).padStart(10)}` +
    `  ${e.flag === 'OK' ? '✅' : e.flag === 'WARNING' ? '⚠️ ' : '🚨'} ${e.flag}`
  );
}

// ─── Internal validation table ────────────────────────────────────────────────
console.log(`\n${SEP}`);
console.log(`  SECTION 3: INTERNAL VALIDATION`);
console.log(`  Formula: expected = work_value + sick_value + area_allow + ot_value - deductions`);
console.log(`  Variance = actual_salary - expected`);
console.log(`${SEP}`);

const valHeader =
  '  Code'.padEnd(9) +
  'Name'.padEnd(26) +
  'Expected'.padStart(10) +
  'Actual'.padStart(10) +
  'Variance'.padStart(10) +
  'Var%'.padStart(7) +
  '  Flag';

console.log(valHeader);
console.log(`  ${THIN}`);

for (const e of employees) {
  const varSign = e.variance >= 0 ? '+' : '';
  console.log(
    `  ${e.employee_id.padEnd(7)} ` +
    `${e.employee_name.slice(0, 24).padEnd(26)}` +
    `${e.expected_total.toFixed(0).padStart(10)}` +
    `${e.actual_salary.toFixed(0).padStart(10)}` +
    `${(varSign + e.variance.toFixed(0)).padStart(10)}` +
    `${e.variance_pct.toFixed(1).padStart(6)}%` +
    `  ${e.flag === 'OK' ? '✅' : e.flag === 'WARNING' ? '⚠️ ' : '🚨'} ${e.flag}`
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const totalActual     = employees.reduce((s, e) => s + e.actual_salary, 0);
const totalGross      = employees.reduce((s, e) => s + e.gross_total, 0);
const totalBasePay    = employees.reduce((s, e) => s + e.work_value, 0);
const totalOT         = employees.reduce((s, e) => s + e.ot_value, 0);
const totalDeductions = employees.reduce((s, e) => s + e.deduction_amount, 0);
const totalWorkDays   = employees.reduce((s, e) => s + e.work_days, 0);
const totalOTHours    = employees.reduce((s, e) => s + e.ot_hours, 0);
const avgSalary       = employees.length > 0 ? totalActual / employees.length : 0;
const okCount         = employees.filter(e => e.flag === 'OK').length;
const warnCount       = employees.filter(e => e.flag === 'WARNING').length;
const critCount       = employees.filter(e => e.flag === 'CRITICAL').length;

const topSalary = [...employees].sort((a, b) => b.actual_salary - a.actual_salary).slice(0, 5);
const topOT     = [...employees].sort((a, b) => b.ot_hours - a.ot_hours).slice(0, 5);
const lowDays   = [...employees].sort((a, b) => a.work_days - b.work_days).slice(0, 5);

console.log(`\n${SEP}`);
console.log(`  SUMMARY — OBSIDIER TOWER`);
console.log(`${SEP}`);
console.log(`  Employees:            ${employees.length}`);
console.log(`  Total work days:      ${totalWorkDays}`);
console.log(`  Total OT hours:       ${totalOTHours}`);
console.log(`  Total base pay:       ${totalBasePay.toFixed(2)}`);
console.log(`  Total OT pay:         ${totalOT.toFixed(2)}`);
console.log(`  Total deductions:     ${totalDeductions.toFixed(2)}`);
console.log(`  Total gross:          ${totalGross.toFixed(2)}`);
console.log(`  Total actual payroll: ${totalActual.toFixed(2)}`);
console.log(`  Average salary:       ${avgSalary.toFixed(2)}`);
console.log('');
console.log(`  Internal validation:`);
console.log(`    ✅ OK       (≤1%):   ${okCount}`);
console.log(`    ⚠️  WARNING  (1–5%):  ${warnCount}`);
console.log(`    🚨 CRITICAL (>5%):   ${critCount}`);

console.log(`\n  💰 TOP 5 SALARIES:`);
topSalary.forEach((e, i) => {
  console.log(`   ${i + 1}. ${e.employee_id.padEnd(8)} ${e.employee_name.padEnd(28)} ${e.actual_salary.toFixed(0).padStart(8)} EGP  (${e.job_title})`);
});

console.log(`\n  ⏰ TOP 5 OVERTIME:`);
topOT.forEach((e, i) => {
  console.log(`   ${i + 1}. ${e.employee_id.padEnd(8)} ${e.employee_name.padEnd(28)} ${e.ot_hours.toFixed(0).padStart(5)} hrs → ${e.ot_value.toFixed(0).padStart(8)} EGP`);
});

console.log(`\n  📉 LOWEST WORK DAYS:`);
lowDays.forEach((e, i) => {
  console.log(`   ${i + 1}. ${e.employee_id.padEnd(8)} ${e.employee_name.padEnd(28)} ${String(e.work_days).padStart(3)} days  (${e.actual_salary.toFixed(0)} EGP)`);
});

// Job title distribution
const jobMap = new Map<string, { count: number; totalPay: number }>();
for (const e of employees) {
  const job = e.job_title || 'Unknown';
  const existing = jobMap.get(job) ?? { count: 0, totalPay: 0 };
  existing.count++;
  existing.totalPay += e.actual_salary;
  jobMap.set(job, existing);
}

console.log(`\n  👷 WORKFORCE BY JOB TITLE:`);
[...jobMap.entries()]
  .sort((a, b) => b[1].count - a[1].count)
  .forEach(([job, data]) => {
    const avg = data.count > 0 ? data.totalPay / data.count : 0;
    console.log(`     ${job.padEnd(22)} ${String(data.count).padStart(3)} staff   total: ${data.totalPay.toFixed(0).padStart(8)} EGP   avg: ${avg.toFixed(0).padStart(7)} EGP`);
  });

console.log(`\n${SEP}`);
console.log(`  ✓ Obsidier Tower training report complete.`);
console.log(`  No data was modified. No Supabase interaction.`);
console.log(`  Site: Obsidier Tower | Period: ${year}/${monthStr}`);
console.log(`${SEP}\n`);
