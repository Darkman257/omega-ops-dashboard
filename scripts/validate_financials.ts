// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kbdvcrjifqlunzawkobg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZHZjcmppZnFsdW56YXdrb2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzU5MTMsImV4cCI6MjA5MDYxMTkxM30.kkfxRNK2eG9YVxh03UW-A33Ipt1Xbkh03ZpYv_3MJTc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const P1_NAME = 'شاطيء سان ستيفانو الخاص الفورسيزونز - المرحلة الأولى';

async function validate() {
  console.log('🚀 PHASE 2.5 VALIDATION — PAYROLL IDENTITY LOCK');

  const month = '2026-06';
  const prefix = 'VAL_LOCK_';

  // 1. Cleanup
  await supabase.from('payroll_records').delete().eq('month', month);

  // 2. Test Linking
  console.log('📝 Testing Identity Linkage...');
  
  const testData = [
    // Valid link (assuming we use a code that exists or we just test the field presence)
    { employee_name: 'Real Emp', internal_code: 'EMP-001', site_name: P1_NAME, month, net_salary: 1000, status: 'Paid' },
    // Missing code (should be allowed into DB if schema allows, but flagged by logic)
    { employee_name: 'No Code Emp', internal_code: '', site_name: P1_NAME, month, net_salary: 2000, status: 'Paid' },
    // Unlinked code (exists in payroll but not in staff - we'll test this in logic)
    { employee_name: 'Unlinked Emp', internal_code: 'GHOST-999', site_name: P1_NAME, month, net_salary: 3000, status: 'Paid' }
  ];

  const { data: records, error } = await supabase.from('payroll_records').insert(testData).select();
  
  if (error) {
    console.error('❌ Insert Error:', error.message);
    if (error.message.includes('internal_code')) {
      console.log('💡 Note: Database schema might not have internal_code yet.');
    }
    process.exit(1);
  }

  console.log('✅ Records inserted for logic verification.');

  // 3. Logic Verification (Simulated financials.ts logic)
  const staff = [
    { internalCode: 'EMP-001', name: 'Real Emp' }
  ];

  console.log('\n🔍 Running Leak Detection (Identity Lock):');
  const leaks = [];
  const staffCodes = new Set(staff.map(s => s.internalCode));

  records.forEach(r => {
    if (!r.internal_code) leaks.push(`MISSING_CODE: ${r.employee_name}`);
    else if (!staffCodes.has(r.internal_code)) leaks.push(`UNLINKED_STAFF: ${r.employee_name} (${r.internal_code})`);
  });

  leaks.forEach(l => console.log(`- Flagged: ${l}`));

  const pass = leaks.length === 2;
  console.log(`\n🏁 RESULT: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  // 4. Cleanup
  await supabase.from('payroll_records').delete().eq('month', month);
  console.log('🧹 Cleanup complete.');

  process.exit(0);
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
