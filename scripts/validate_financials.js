import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kbdvcrjifqlunzawkobg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZHZjcmppZnFsdW56YXdrb2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzU5MTMsImV4cCI6MjA5MDYxMTkxM30.kkfxRNK2eG9YVxh03UW-A33Ipt1Xbkh03ZpYv_3MJTc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validate() {
  console.log('🚀 Schema Debug...');
  const { data: samples, error: sError } = await supabase.from('projects').select('*').limit(1);
  if (sError) {
    console.error('Error:', sError.message);
  } else if (samples && samples.length > 0) {
    console.log('Columns:', Object.keys(samples[0]).join(', '));
  } else {
    console.log('No projects found.');
  }
}

validate();
