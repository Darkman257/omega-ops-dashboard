// ─── Payroll Training Report ──────────────────────────────────────────────────
// Uses a reference month (e.g. April 2026) of attendance data to calculate
// per-employee payroll estimates WITHOUT pushing anything to the database.
//
// This is a training/validation tool — not a live payroll calculation.
//
// Calculation rules:
//   payable_days = present + offsite + night_shift + sick + rest_day
//                + compensatory + permitted_leave
//   daily_rate   = basic_salary / calendar_days_in_month
//   estimated_salary = daily_rate × payable_days
//
// If basic_salary is missing → flag: missing_salary_data
//
// Run:
//   pnpm --filter @workspace/omega-dashboard run payroll-training -- 2026 4
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const args  = process.argv.slice(2).filter(a => a !== '--');
const year  = parseInt(args[0] ?? '2026', 10);
const month = parseInt(args[1] ?? '4',    10);

if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
  console.error('\nUsage: payroll-training <year> <month>\n');
  process.exit(1);
}

const supabase   = createClient(SUPABASE_URL, SUPABASE_KEY);
const monthStr   = String(month).padStart(2, '0');
const daysInMonth = new Date(year, month, 0).getDate();

// ─── Status classification ───────────────────────────────────────────────────
const PAYABLE_STATUSES = new Set([
  'present', 'offsite', 'night_shift', 'sick',
  'rest_day', 'compensatory', 'permitted_leave'
]);

const ABSENT_STATUSES = new Set([
  'absent', 'excused_absence'
]);

// All other statuses (off, transferred, pending_review, unknown) → not payable, not absent

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmployeePayroll {
  employee_id: string;
  employee_name: string;
  basic_salary: number | null;
  daily_rate: number | null;
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

// ─── Fetch data ───────────────────────────────────────────────────────────────
const periodStart = `${year}-${monthStr}-01`;
const periodEnd   = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

const SEP = '━'.repeat(80);

console.log(`\n${SEP}`);
console.log(`  OMEGA PAYROLL TRAINING REPORT`);
console.log(`  Reference month: ${year}/${monthStr}  (${periodStart} → ${periodEnd})`);
console.log(`  Calendar days:   ${daysInMonth}`);
console.log(`  Mode:            REPORT ONLY — no DB writes`);
console.log(`  Time:            ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

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
  staffMap.set(
    String(s.internal_code),
    {
      name:   s.full_name ?? '',
      salary: s.basic_salary != null ? Number(s.basic_salary) : null
    }
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
    const staffInfo = staffMap.get(empId);
    const salary    = staffInfo?.salary ?? null;
    const dailyRate = salary != null ? Math.round((salary / daysInMonth) * 100) / 100 : null;

    employeeMap.set(empId, {
      employee_id:          empId,
      employee_name:        row.employee_name ?? staffInfo?.name ?? '?',
      basic_salary:         salary,
      daily_rate:           dailyRate,
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
      flags:                salary == null ? ['missing_salary_data'] : []
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

  if (emp.daily_rate != null) {
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
  '  Flags';

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
    (emp.flags.length > 0 ? `  ${emp.flags.join(', ')}` : '');

  console.log(line);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const totalEmployees     = employees.length;
const totalPayableDays   = employees.reduce((s, e) => s + e.payable_days, 0);
const totalEstimated     = employees.reduce((s, e) => s + (e.estimated_salary ?? 0), 0);
const missingSalary      = employees.filter(e => e.flags.includes('missing_salary_data'));
const perfectAttendance  = employees.filter(e => e.absent_days === 0 && e.payable_days >= 20);
const topAbsent          = [...employees].sort((a, b) => b.absent_days - a.absent_days).slice(0, 10);

console.log(`\n${SEP}`);
console.log(`  SUMMARY`);
console.log(`${SEP}`);
console.log(`  Total employees:          ${totalEmployees}`);
console.log(`  Total payable days:       ${totalPayableDays}`);
console.log(`  Total estimated payroll:  ${totalEstimated.toFixed(2)}`);
console.log(`  Missing salary data:      ${missingSalary.length}`);
console.log(`  Perfect attendance (≥20d): ${perfectAttendance.length}`);

if (missingSalary.length > 0) {
  console.log(`\n  ⚠ MISSING SALARY DATA (${missingSalary.length}):`);
  missingSalary.forEach(e => {
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
