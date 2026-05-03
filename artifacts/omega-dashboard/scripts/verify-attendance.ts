#!/usr/bin/env node --experimental-strip-types
// Verify attendance data imported into Supabase
// Run: node --env-file=.env --experimental-strip-types scripts/verify-attendance.ts 2026 4

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const args = process.argv.slice(2).filter(a => a !== '--');
const year  = parseInt(args[0] ?? '2026', 10);
const month = parseInt(args[1] ?? '4',    10);
const batchId = `import_${year}_${String(month).padStart(2, '0')}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  OMEGA ATTENDANCE VERIFICATION`);
console.log(`  Batch: ${batchId}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

// 1. Total rows for this batch
const { count: totalRows } = await supabase
  .from('attendance')
  .select('*', { count: 'exact', head: true })
  .eq('import_batch_id', batchId);

console.log(`  Total rows in batch:  ${totalRows ?? 0}`);

// 2. Count by status
const { data: allRows } = await supabase
  .from('attendance')
  .select('status')
  .eq('import_batch_id', batchId);

const statusCounts: Record<string, number> = {};
for (const row of allRows ?? []) {
  statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
}

console.log(`\n  Status Breakdown:`);
Object.entries(statusCounts)
  .sort(([, a], [, b]) => b - a)
  .forEach(([status, count]) => {
    const bar = '█'.repeat(Math.round(count / ((totalRows ?? 1) / 20)));
    console.log(`    ${status.padEnd(28)} ${String(count).padStart(4)}  ${bar}`);
  });

// 3. Count by employee_id (top 10 most records)
const { data: empRows } = await supabase
  .from('attendance')
  .select('employee_id, employee_name')
  .eq('import_batch_id', batchId);

const empCounts: Record<string, { name: string; count: number }> = {};
for (const row of empRows ?? []) {
  if (!empCounts[row.employee_id]) {
    empCounts[row.employee_id] = { name: row.employee_name ?? '', count: 0 };
  }
  empCounts[row.employee_id].count++;
}

console.log(`\n  Per-Employee Record Count (sample 10):`);
Object.entries(empCounts)
  .sort(([, a], [, b]) => b.count - a.count)
  .slice(0, 10)
  .forEach(([id, { name, count }]) => {
    console.log(`    [${id}] ${name.padEnd(35)} ${count} days`);
  });

// 4. Sample 10 rows
const { data: sample } = await supabase
  .from('attendance')
  .select('employee_id, employee_name, date, status, raw_value')
  .eq('import_batch_id', batchId)
  .order('date')
  .limit(10);

console.log(`\n  Sample Rows:`);
(sample ?? []).forEach(r => {
  console.log(`    [${r.date}] ${r.employee_id} ${r.employee_name?.padEnd(30)} → ${r.status}  (${r.raw_value})`);
});

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
