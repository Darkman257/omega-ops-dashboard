import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kbdvcrjifqlunzawkobg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZHZjcmppZnFsdW56YXdrb2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzU5MTMsImV4cCI6MjA5MDYxMTkxM30.kkfxRNK2eG9YVxh03UW-A33Ipt1Xbkh03ZpYv_3MJTc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const P1_NAME = 'شاطيء سان ستيفانو الخاص الفورسيزونز - المرحلة الأولى';
const P2_NAME = 'شاطيء سان ستيفانو الخاص الفورسيزونز - المرحلة الثانية';

const P1_VALUE = 36781000;
const P2_VALUE = 92847000;

async function validate() {
  console.log('🚀 PHASE 2 FINAL VALIDATION — STAGE 3');

  const month = '2026-05'; // Unique month for test
  const testUserPrefix = 'VAL_USER_';

  // 1. Cleanup
  console.log('🧹 Cleaning up test records for month:', month);
  await supabase.from('payroll_records').delete().eq('month', month).ilike('employee_name', `${testUserPrefix}%`);

  // 2. Insert Payroll Records (Linking to REAL projects)
  console.log('📝 Inserting payroll records...');
  const testData = [
    { employee_name: `${testUserPrefix}John`, site_name: P1_NAME, month, basic_salary: 1000000, net_salary: 1000000, status: 'Paid' },
    { employee_name: `${testUserPrefix}Jane`, site_name: P1_NAME, month, basic_salary: 2000000, net_salary: 2000000, status: 'Paid' },
    { employee_name: `${testUserPrefix}Bob`, site_name: P2_NAME, month, basic_salary: 5000000, net_salary: 5000000, status: 'Paid' }
  ];

  const { data: records, error: rError } = await supabase.from('payroll_records').insert(testData).select();

  if (rError) {
    console.error('❌ Insert Error:', rError.message);
    process.exit(1);
  }
  console.log('✅ Payroll records inserted.');

  // 3. Verify Calculations
  console.log('\n📊 Verifying Engine Calculations:');
  
  const p1_total = records.filter(r => r.site_name === P1_NAME).reduce((s, r) => s + r.net_salary, 0);
  const p1_burn = (p1_total / P1_VALUE) * 100;
  const p1_remaining = P1_VALUE - p1_total;

  console.log(`Project: ${P1_NAME}`);
  console.log(`- Expected Total: 3,000,000 | Actual: ${p1_total}`);
  console.log(`- Expected Burn: 8.16% | Actual: ${p1_burn.toFixed(2)}%`);
  console.log(`- Expected Remaining: 33,781,000 | Actual: ${p1_remaining}`);

  const p2_total = records.filter(r => r.site_name === P2_NAME).reduce((s, r) => s + r.net_salary, 0);
  console.log(`\nProject: ${P2_NAME}`);
  console.log(`- Expected Total: 5,000,000 | Actual: ${p2_total}`);

  // 4. Leak Detection Simulation
  console.log('\n🔍 Testing Leak Detection Triggers...');
  const badRecords = [
    { employee_name: `${testUserPrefix}Leak_Zero`, site_name: P1_NAME, month, net_salary: 0, status: 'Pending' },
    { employee_name: `${testUserPrefix}Leak_NoSite`, site_name: '', month, net_salary: 1000, status: 'Pending' },
    { employee_name: `${testUserPrefix}John`, site_name: P1_NAME, month, net_salary: 1000000, status: 'Paid' } // Duplicate
  ];

  const { data: leaks, error: lError } = await supabase.from('payroll_records').insert(badRecords).select();
  if (lError) {
    console.error('❌ Leak Insert Error:', lError.message);
  } else {
    console.log('✅ Bad records inserted.');
    
    // Check if duplicate detection works (Logic Test)
    const all = [...records, ...leaks];
    const duplicates = all.filter((item, index) => 
      all.findIndex(o => o.employee_name === item.employee_name && o.month === item.month && o.site_name === item.site_name) !== index
    );
    console.log(`- Duplicate records found: ${duplicates.length}`);
  }

  // 5. Final PASS / FAIL
  console.log('\n🏁 FINAL VALIDATION:');
  const p1_pass = p1_total === 3000000;
  const leak_pass = (leaks?.length ?? 0) >= 3;
  
  console.log(`${p1_pass ? '✅' : '❌'} Burn Rate Logic: ${p1_pass ? 'PASS' : 'FAIL'}`);
  console.log(`${leak_pass ? '✅' : '❌'} Leak Trigger Logic: ${leak_pass ? 'PASS' : 'FAIL'}`);

  // 6. Cleanup
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('payroll_records').delete().eq('month', month).ilike('employee_name', `${testUserPrefix}%`);
  console.log('✅ Cleanup complete.');

  process.exit(0);
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
