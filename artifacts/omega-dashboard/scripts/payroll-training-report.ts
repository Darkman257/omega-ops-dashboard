// ─── Payroll Training Report ──────────────────────────────────────────────────
// Uses a reference month (e.g. April 2026) of attendance data to calculate
// per-employee payroll estimates WITHOUT pushing anything to the database.
//
// This is a training/validation tool — not a live payroll calculation.
//
// Rate resolution priority:
//   1. Rates CSV daily_rate     (--rates ./data/april-rates.csv)
//   2. Rates CSV basic_salary / 30
//   3. Staff DB  basic_salary / 30  (if > 0)
//   4. Flag: missing_rate
//
// Calculation rules:
//   payable_days = present + offsite + night_shift + sick + rest_day
//                + compensatory + permitted_leave
//   estimated_salary = daily_rate × payable_days
//
// Run:
//   pnpm --filter @workspace/omega-dashboard run payroll-training -- 2026 4
//   pnpm --filter @workspace/omega-dashboard run payroll-training -- 2026 4 --rates ./data/april-rates.csv
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const rawArgs    = process.argv.slice(2).filter(a => a !== '--');
const positional = rawArgs.filter(a => !a.startsWith('--'));
const year       = parseInt(positional[0] ?? '2026', 10);
const month      = parseInt(positional[1] ?? '4',    10);

// Parse --rates flag
const ratesIdx  = rawArgs.indexOf('--rates');
const ratesFile = ratesIdx !== -1 ? rawArgs[ratesIdx + 1] : null;

if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
  console.error('\nUsage: payroll-training <year> <month> [--rates <csv>]\n');
  process.exit(1);
}

const supabase    = createClient(SUPABASE_URL, SUPABASE_KEY);
const monthStr    = String(month).padStart(2, '0');
const daysInMonth = new Date(year, month, 0).getDate();

// ─── Status classification ───────────────────────────────────────────────────
const PAYABLE_STATUSES = new Set([
  'present', 'offsite', 'night_shift', 'sick',
  'rest_day', 'compensatory', 'permitted_leave'
]);

const ABSENT_STATUSES = new Set([
  'absent', 'excused_absence'
]);

// ─── Types ────────────────────────────────────────────────────────────────────
interface RateInput {
  daily_rate: number | null;
  basic_salary: number | null;
}

interface EmployeePayroll {
  employee_id: string;
  employee_name: string;
  basic_salary: number | null;
  daily_rate: number | null;
  rate_source: string;            // 'csv_daily' | 'csv_salary' | 'db_salary' | 'none'
  present_days: number;
  absent_days: number;
  rest_days: number;
  sick_days: number;
  offsite_days: number;
  night_shift_days: number;
  permitted_leave_days: number;
  compensatory_days: number;
  off_days: number;
  other_days: number;
  payable_days: number;
  estimated_salary: number | null;
  flags: string[];
}

// ─── Parse rates CSV ──────────────────────────────────────────────────────────
function loadRatesCSV(filePath: string): Map<string, RateInput> {
  const map = new Map<string, RateInput>();
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || i === 0 && line.toLowerCase().includes('employee_id')) continue;

    const parts = line.split(',');
    const empId = parts[0]?.trim();
    if (!empId) continue;

    const dailyRaw  = parts[1]?.trim();
    const salaryRaw = parts[2]?.trim();

    map.set(empId, {
      daily_rate:   dailyRaw  && dailyRaw !== ''  ? Number(dailyRaw)  : null,
      basic_salary: salaryRaw && salaryRaw !== '' ? Number(salaryRaw) : null
    });
  }

  return map;
}

// ─── Resolve daily rate with priority cascade ─────────────────────────────────
function resolveDailyRate(
  empId: string,
  ratesMap: Map<string, RateInput> | null,
  dbSalary: number | null
): { rate: number | null; source: string } {
  // 1. CSV daily_rate
  if (ratesMap?.has(empId)) {
    const csvRate = ratesMap.get(empId)!;
    if (csvRate.daily_rate != null && csvRate.daily_rate > 0) {
      return { rate: csvRate.daily_rate, source: 'csv_daily' };
    }
    // 2. CSV basic_salary / 30
    if (csvRate.basic_salary != null && csvRate.basic_salary > 0) {
      return { rate: Math.round((csvRate.basic_salary / 30) * 100) / 100, source: 'csv_salary' };
    }
  }
  // 3. DB basic_salary / 30 (must be > 0, not just non-null)
  if (dbSalary != null && dbSalary > 0) {
    return { rate: Math.round((dbSalary / 30) * 100) / 100, source: 'db_salary' };
  }
  // 4. No rate
  return { rate: null, source: 'none' };
}

// ─── Fetch data ───────────────────────────────────────────────────────────────
const periodStart = `${year}-${monthStr}-01`;
const periodEnd   = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

const SEP = '━'.repeat(86);

console.log(`\n${SEP}`);
console.log(`  OMEGA PAYROLL TRAINING REPORT`);
console.log(`  Reference month: ${year}/${monthStr}  (${periodStart} → ${periodEnd})`);
console.log(`  Calendar days:   ${daysInMonth}`);
console.log(`  Rates file:      ${ratesFile ?? '(none — using DB only)'}`);
console.log(`  Mode:            REPORT ONLY — no DB writes`);
console.log(`  Time:            ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

// Load rates CSV if provided
let ratesMap: Map<string, RateInput> | null = null;
if (ratesFile) {
  if (!fs.existsSync(ratesFile)) {
    console.error(`  ✗ Rates file not found: ${ratesFile}`);
    process.exit(1);
  }
  ratesMap = loadRatesCSV(ratesFile);
  console.log(`  [0/3] Loaded ${ratesMap.size} rates from CSV.`);
}

console.log('  [1/3] Fetching staff...');
const { data: staffData, error: staffErr } = await supabase
  .from('staff')
  .select('internal_code, full_name, basic_salary');

if (staffErr) {
  console.error(`  ✗ Staff fetch failed: ${staffErr.message}`);
  process.exit(1);
}

const staffMap = new Map<string, { name: string; salary: number | null }>();
for (const s of staffData ?? []) {
  const sal = s.basic_salary != null ? Number(s.basic_salary) : null;
  staffMap.set(
    String(s.internal_code),
    { name: s.full_name ?? '', salary: sal }
  );
}

console.log(`  [2/3] Fetching attendance for ${year}/${monthStr}...`);
const { data: attendanceData, error: attErr } = await supabase
  .from('attendance')
  .select('employee_id, employee_name, date, status')
  .gte('date', periodStart)
  .lte('date', periodEnd);

if (attErr) {
  console.error(`  ✗ Attendance fetch failed: ${attErr.message}`);
  process.exit(1);
}

console.log('  [3/3] Calculating payroll...\n');

// ─── Group attendance by employee ─────────────────────────────────────────────
type AttRow = { employee_id: string; employee_name: string; date: string; status: string };
const attendanceRows = (attendanceData ?? []) as AttRow[];

const employeeMap = new Map<string, EmployeePayroll>();

for (const row of attendanceRows) {
  const empId = row.employee_id;

  if (!employeeMap.has(empId)) {
    const staffInfo  = staffMap.get(empId);
    const dbSalary   = staffInfo?.salary ?? null;
    const { rate, source } = resolveDailyRate(empId, ratesMap, dbSalary);

    const flags: string[] = [];
    if (rate === null) flags.push('missing_rate');

    employeeMap.set(empId, {
      employee_id:          empId,
      employee_name:        row.employee_name ?? staffInfo?.name ?? '?',
      basic_salary:         dbSalary,
      daily_rate:           rate,
      rate_source:          source,
      present_days:         0,
      absent_days:          0,
      rest_days:            0,
      sick_days:            0,
      offsite_days:         0,
      night_shift_days:     0,
      permitted_leave_days: 0,
      compensatory_days:    0,
      off_days:             0,
      other_days:           0,
      payable_days:         0,
      estimated_salary:     null,
      flags
    });
  }

  const emp = employeeMap.get(empId)!;
  const status = row.status;

  switch (status) {
    case 'present':          emp.present_days++;          break;
    case 'absent':           emp.absent_days++;           break;
    case 'excused_absence':  emp.absent_days++;           break;
    case 'rest_day':         emp.rest_days++;             break;
    case 'sick':             emp.sick_days++;             break;
    case 'offsite':          emp.offsite_days++;          break;
    case 'night_shift':      emp.night_shift_days++;      break;
    case 'permitted_leave':  emp.permitted_leave_days++;  break;
    case 'compensatory':     emp.compensatory_days++;     break;
    case 'off':              emp.off_days++;              break;
    default:                 emp.other_days++;            break;
  }
}

// ─── Calculate payable days + estimated salary ────────────────────────────────
for (const emp of employeeMap.values()) {
  emp.payable_days =
    emp.present_days +
    emp.offsite_days +
    emp.night_shift_days +
    emp.sick_days +
    emp.rest_days +
    emp.compensatory_days +
    emp.permitted_leave_days;

  if (emp.daily_rate != null && emp.daily_rate > 0) {
    emp.estimated_salary = Math.round(emp.daily_rate * emp.payable_days * 100) / 100;
  }
}

// ─── Sort by employee_id ──────────────────────────────────────────────────────
const employees = [...employeeMap.values()].sort(
  (a, b) => Number(a.employee_id) - Number(b.employee_id)
);

// ─── Print per-employee table ─────────────────────────────────────────────────
console.log(`${SEP}`);
console.log(`  EMPLOYEE PAYROLL BREAKDOWN`);
console.log(`${SEP}`);

const header =
  '  Code'.padEnd(9) +
  'Name'.padEnd(28) +
  'Prs'.padStart(5) +
  'Abs'.padStart(5) +
  'Rst'.padStart(5) +
  'Sck'.padStart(5) +
  'Off'.padStart(5) +
  'Ngt'.padStart(5) +
  'Lv'.padStart(5) +
  'Pay'.padStart(5) +
  'Rate'.padStart(9) +
  'Est.Salary'.padStart(13) +
  '  Src  ' +
  'Flags';

console.log(header);
console.log('  ' + '─'.repeat(header.length - 2));

for (const emp of employees) {
  const line =
    `  ${emp.employee_id.padEnd(7)}` +
    emp.employee_name.slice(0, 26).padEnd(28) +
    String(emp.present_days).padStart(5) +
    String(emp.absent_days).padStart(5) +
    String(emp.rest_days).padStart(5) +
    String(emp.sick_days).padStart(5) +
    String(emp.offsite_days).padStart(5) +
    String(emp.night_shift_days).padStart(5) +
    String(emp.permitted_leave_days).padStart(5) +
    String(emp.payable_days).padStart(5) +
    (emp.daily_rate != null ? emp.daily_rate.toFixed(2) : '—').padStart(9) +
    (emp.estimated_salary != null ? emp.estimated_salary.toFixed(2) : '—').padStart(13) +
    `  ${emp.rate_source.padEnd(11)}` +
    (emp.flags.length > 0 ? emp.flags.join(', ') : '');

  console.log(line);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const totalEmployees     = employees.length;
const totalPayableDays   = employees.reduce((s, e) => s + e.payable_days, 0);
const totalEstimated     = employees.reduce((s, e) => s + (e.estimated_salary ?? 0), 0);
const withRate           = employees.filter(e => e.daily_rate != null && e.daily_rate > 0);
const missingRate        = employees.filter(e => e.flags.includes('missing_rate'));
const perfectAttendance  = employees.filter(e => e.absent_days === 0 && e.payable_days >= 20);
const topAbsent          = [...employees].sort((a, b) => b.absent_days - a.absent_days).slice(0, 10);

console.log(`\n${SEP}`);
console.log(`  SUMMARY`);
console.log(`${SEP}`);
console.log(`  Total employees:          ${totalEmployees}`);
console.log(`  With rate data:           ${withRate.length}`);
console.log(`  Missing rate:             ${missingRate.length}`);
console.log(`  Total payable days:       ${totalPayableDays}`);
console.log(`  Total estimated payroll:  ${totalEstimated.toFixed(2)}`);
console.log(`  Perfect attendance (≥20d): ${perfectAttendance.length}`);

// Rate source breakdown
const srcCounts = { csv_daily: 0, csv_salary: 0, db_salary: 0, none: 0 };
for (const e of employees) {
  const src = e.rate_source as keyof typeof srcCounts;
  if (src in srcCounts) srcCounts[src]++;
}
console.log(`\n  RATE SOURCE BREAKDOWN:`);
console.log(`    CSV daily_rate:    ${srcCounts.csv_daily}`);
console.log(`    CSV basic_salary:  ${srcCounts.csv_salary}`);
console.log(`    DB basic_salary:   ${srcCounts.db_salary}`);
console.log(`    No rate (missing): ${srcCounts.none}`);

if (missingRate.length > 0) {
  console.log(`\n  ⚠ MISSING RATE — no salary estimate possible (${missingRate.length}):`);
  missingRate.forEach(e => {
    console.log(`     ${e.employee_id.padEnd(8)} ${e.employee_name}`);
  });
}

console.log(`\n  TOP 10 ABSENT EMPLOYEES:`);
topAbsent.forEach((e, i) => {
  console.log(`   ${String(i + 1).padStart(2)}. ${e.employee_id.padEnd(8)} ${e.employee_name.padEnd(28)} absent: ${e.absent_days} days`);
});

if (perfectAttendance.length > 0) {
  console.log(`\n  ⭐ PERFECT ATTENDANCE (≥20 payable, 0 absent):`);
  perfectAttendance.forEach(e => {
    console.log(`     ${e.employee_id.padEnd(8)} ${e.employee_name.padEnd(28)} payable: ${e.payable_days} days`);
  });
}

console.log(`\n${SEP}`);
console.log(`  ✓ Training report complete. No data was modified.`);
console.log(`  Period mode: reference_month (${year}/${monthStr})`);
console.log(`${SEP}\n`);
