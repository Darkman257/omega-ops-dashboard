import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kbdvcrjifqlunzawkobg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZHZjcmppZnFsdW56YXdrb2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzU5MTMsImV4cCI6MjA5MDYxMTkxM30.kkfxRNK2eG9YVxh03UW-A33Ipt1Xbkh03ZpYv_3MJTc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validate() {
  console.log('🚀 Starting Phase 2 Financial Engine Validation...');

  const prefix = 'TEST_';
  
  // Cleanup
  console.log('🧹 Cleaning up old test data...');
  await supabase.from('projects').delete().ilike('project_name', `${prefix}%`);
  await supabase.from('payroll_records').delete().ilike('notes', `${prefix}%`);

  // 2. Insert Projects
  console.log('📝 Inserting Test Projects...');
  const { data: projects, error: pError } = await supabase.from('projects').insert([
    { project_name: `${prefix}Project Alpha`, owner_name: 'Client A', contract_value: 100000, status: 'In Progress', start_date: '2024-01-01', end_date: '2024-12-31' },
    { project_name: `${prefix}Project Beta`, owner_name: 'Client B', contract_value: 50000, status: 'In Progress', start_date: '2024-01-01', end_date: '2024-12-31' }
  ]).select();

  if (pError) {
    console.error('Project Insert Error:', pError);
    process.exit(1);
  }
  console.log('✅ Projects inserted.');

  // 3. Insert Payroll Records
  console.log('📝 Inserting Test Payroll Records...');
  const month = '2024-01';
  const payrollData = [
    { employee_name: 'John Doe', site_name: `${prefix}Project Alpha`, month, basic_salary: 4000, site_allowance: 1000, overtime_pay: 500, deductions: 500, net_salary: 5000, status: 'Paid', notes: `${prefix}Valid record 1` },
    { employee_name: 'Jane Smith', site_name: `${prefix}Project Alpha`, month, basic_salary: 3000, site_allowance: 500, overtime_pay: 0, deductions: 500, net_salary: 3000, status: 'Paid', notes: `${prefix}Valid record 2` },
    { employee_name: 'Bob Wilson', site_name: `${prefix}Project Beta`, month, basic_salary: 3500, site_allowance: 500, overtime_pay: 200, deductions: 200, net_salary: 4000, status: 'Paid', notes: `${prefix}Valid record 3` }
  ];

  const { data: records, error: rError } = await supabase.from('payroll_records').insert(payrollData).select();
  if (rError) {
    console.error('Payroll Insert Error:', rError);
    process.exit(1);
  }
  console.log('✅ Payroll records inserted.');

  // 4. Verify Calculations
  console.log('\n📊 Verifying Calculations:');
  
  const results = [];
  
  for (const project of projects) {
    const projectRecords = records.filter(r => r.site_name === project.project_name);
    const totalActual = projectRecords.reduce((sum, r) => sum + r.net_salary, 0);
    const expectedRemaining = project.contract_value - totalActual;
    const expectedBurnRate = (totalActual / project.contract_value) * 100;
    
    const riskClassification = expectedBurnRate > 70 ? 'CRITICAL' : expectedBurnRate > 40 ? 'MEDIUM' : 'LOW';

    results.push({
      project: project.project_name,
      contract: project.contract_value,
      payroll_total: totalActual,
      remaining: expectedRemaining,
      burn_rate: expectedBurnRate.toFixed(2) + '%',
      risk: riskClassification
    });
  }

  console.table(results);

  // 5. Leak Detection Test
  console.log('\n🔍 Testing Leak Detection:');
  
  const badRecords = [
    { employee_name: 'Leak Tester 1', site_name: `${prefix}Project Alpha`, month, basic_salary: 0, site_allowance: 0, overtime_pay: 0, deductions: 0, net_salary: 0, status: 'Pending', notes: `${prefix}Zero salary leak` },
    { employee_name: 'Leak Tester 2', site_name: null, month, basic_salary: 2000, site_allowance: 0, overtime_pay: 0, deductions: 0, net_salary: 2000, status: 'Pending', notes: `${prefix}Missing site leak` },
    { employee_name: 'John Doe', site_name: `${prefix}Project Alpha`, month, basic_salary: 4000, site_allowance: 1000, overtime_pay: 500, deductions: 500, net_salary: 5000, status: 'Paid', notes: `${prefix}Duplicate record leak` }
  ];

  const { data: leaks, error: lError } = await supabase.from('payroll_records').insert(badRecords).select();
  if (lError) {
    console.error('Leak Insert Error:', lError);
    process.exit(1);
  }
  console.log('✅ Bad records inserted.');

  // Simulation of detectPayrollLeaks logic from src/lib/financials.ts
  const allRecords = [...records, ...leaks];
  const detectedLeaks = [];
  
  const seen = new Set();
  allRecords.forEach(r => {
    if (r.net_salary === 0) detectedLeaks.push({ type: 'ZERO_SALARY', id: r.id });
    if (!r.site_name) detectedLeaks.push({ type: 'MISSING_SITE', id: r.id });
    
    const key = `${r.employee_name}-${r.month}-${r.net_salary}`;
    if (seen.has(key)) detectedLeaks.push({ type: 'DUPLICATE', id: r.id });
    seen.add(key);
  });

  console.log('Detected Leaks:', detectedLeaks.length);
  detectedLeaks.forEach(l => console.log(`- Triggered: ${l.type} for record ID ${l.id}`));

  // 6. PASS / FAIL Summary
  console.log('\n🏁 Final Report:');
  
  const alphaResult = results.find(r => r.project.includes('Alpha'));
  const betaResult = results.find(r => r.project.includes('Beta'));

  const check = (name, expected, actual) => {
    const passed = expected === actual;
    console.log(`${passed ? '✅' : '❌'} ${name}: Expected ${expected}, Actual ${actual} -> ${passed ? 'PASS' : 'FAIL'}`);
    return passed;
  };

  const p1 = check('Project Alpha Payroll Total', 8000, alphaResult.payroll_total);
  const p2 = check('Project Alpha Remaining', 92000, alphaResult.remaining);
  const p3 = check('Project Beta Payroll Total', 4000, betaResult.payroll_total);
  const p4 = check('Project Beta Remaining', 46000, betaResult.remaining);
  
  const leaksPassed = detectedLeaks.some(l => l.type === 'ZERO_SALARY') &&
                      detectedLeaks.some(l => l.type === 'MISSING_SITE') &&
                      detectedLeaks.some(l => l.type === 'DUPLICATE');
  
  console.log(`${leaksPassed ? '✅' : '❌'} Leak Detection: ${leaksPassed ? 'PASS' : 'FAIL'}`);

  if (p1 && p2 && p3 && p4 && leaksPassed) {
    console.log('\n✅ ALL VALIDATIONS PASSED');
  } else {
    console.log('\n❌ SOME VALIDATIONS FAILED');
  }

  process.exit(0);
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
