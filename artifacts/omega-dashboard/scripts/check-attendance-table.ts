// Quick check: what's actually in the attendance table?
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
);

// Check total count with no filters
const { count: total } = await supabase
  .from('attendance')
  .select('*', { count: 'exact', head: true });

console.log('Total attendance rows (no filter):', total);

// Check unique batch IDs present
const { data: batches } = await supabase
  .from('attendance')
  .select('import_batch_id')
  .limit(5);

console.log('Sample batch IDs found:', batches?.map(r => r.import_batch_id));

// Check columns by fetching 1 row
const { data: sample } = await supabase
  .from('attendance')
  .select('*')
  .limit(1);

console.log('Sample row:', JSON.stringify(sample?.[0], null, 2));
