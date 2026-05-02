import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kbdvcrjifqlunzawkobg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZHZjcmppZnFsdW56YXdrb2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzU5MTMsImV4cCI6MjA5MDYxMTkxM30.kkfxRNK2eG9YVxh03UW-A33Ipt1Xbkh03ZpYv_3MJTc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validate() {
  console.log('🚀 Starting Phase 2 Financial Engine Validation...');

  console.log('🔐 Authenticating as admin@omega.com...');
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@omega.com',
    password: 'omega2026'
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
  } else {
    console.log('✅ Authenticated successfully!');
  }

  const prefix = 'VAL_';
  
  console.log('🧹 Cleaning up old test data...');
  await supabase.from('projects').delete().ilike('project_name', `${prefix}%`);
  await supabase.from('payroll_records').delete().ilike('notes', `${prefix}%`);

  console.log('📝 Inserting Test Projects...');
  const { data: projects, error: pError } = await supabase.from('projects').insert([
    { project_name: `${prefix}Project Alpha`, owner_name: 'Client A', contract_value: 100000, status: 'In Progress' },
    { project_name: `${prefix}Project Beta`, owner_name: 'Client B', contract_value: 50000, status: 'In Progress' }
  ]).select();

  if (pError) {
    console.error('❌ Project Insert Error:', pError.message);
    process.exit(1);
  }
  console.log('✅ Projects inserted.');

  console.log('📝 Inserting Test Payroll Records...');
  const month = '2024-01';
  const payrollData = [
    { employee_name: 'John Doe', site_name: `${prefix}Project Alpha`, month, net_salary: 5000, status: 'Paid', notes: `${prefix}Valid 1` },
    { employee_name: 'Jane Smith', site_name: `${prefix}Project Alpha`, month, net_salary: 3000, status: 'Paid', notes: `${prefix}Valid 2` },
    { employee_name: 'Bob Wilson', site_name: `${prefix}Project Beta`, month, net_salary: 4000, status: 'Paid', notes: `${prefix}Valid 3` }
  ];

  const { data: records, error: rError } = await supabase.from('payroll_records').insert(payrollData).select();
  if (rError) {
    console.error('❌ Payroll Insert Error:', rError.message);
    process.exit(1);
  }
  console.log('✅ Payroll records inserted.');

  console.log('\n📊 Verifying Calculations:');
  const results = projects.map(project => {
    const projectRecords = records.filter(r => r.site_name === project.project_name);
    const totalActual = projectRecords.reduce((sum, r) => sum + r.net_salary, 0);
    const expectedRemaining = project.contract_value - totalActual;
    const expectedBurnRate = (totalActual / project.contract_value) * 100;
    const riskClassification = expectedBurnRate >= 70 ? 'HIGH_RISK' : expectedBurnRate >= 50 ? 'MEDIUM_RISK' : 'SAFE';

    return {
      project: project.project_name,
      contract: project.contract_value,
      payroll_total: totalActual,
      remaining: expectedRemaining,
      burn_rate: expectedBurnRate.toFixed(2) + '%',
      risk: riskClassification
    };
  });

  console.table(results);

  console.log('\n🔍 Testing Leak Detection:');
  const badRecords = [
    { employee_name: 'Leak Tester 1', site_name: `${prefix}Project Alpha`, month, net_salary: 0, status: 'Pending', notes: `${prefix}Zero` },
    { employee_name: 'Leak Tester 2', site_name: '', month, net_salary: 2000, status: 'Pending', notes: `${prefix}Missing` },
    { employee_name: 'John Doe', site_name: `${prefix}Project Alpha`, month, net_salary: 5000, status: 'Paid', notes: `${prefix}Duplicate` }
  ];

  const { data: leaks, error: lError } = await supabase.from('payroll_records').insert(badRecords).select();
  if (lError) {
    console.error('❌ Leak Insert Error:', lError.message);
    process.exit(1);
  }
  
  const allRecords = [...records, ...leaks];
  const detectedLeaks = [];
  const seen = new Set();
  allRecords.forEach(r => {
    if (r.net_salary <= 0) detectedLeaks.push({ type: 'ZERO_SALARY', id: r.id });
    if (!r.site_name) detectedLeaks.push({ type: 'MISSING_SITE', id: r.id });
    const key = `${r.employee_name}-${r.month}-${r.site_name}`;
    if (seen.has(key)) detectedLeaks.push({ type: 'DUPLICATE', id: r.id });
    seen.add(key);
  });

  console.log('Detected Leaks:', detectedLeaks.length);
  
  console.log('\n🏁 Final Report:');
  const check = (name, expected, actual) => {
    const passed = expected === actual;
    console.log(`${passed ? '✅' : '❌'} ${name}: ${passed ? 'PASS' : 'FAIL'}`);
  };

  const alpha = results.find(r => r.project.includes('Alpha'));
  const beta = results.find(r => r.project.includes('Beta'));
  check('Alpha Total', 8000, alpha.payroll_total);
  check('Beta Total', 4000, beta.payroll_total);
  check('Leak Detection', true, detectedLeaks.length >= 3);

  process.exit(0);
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
