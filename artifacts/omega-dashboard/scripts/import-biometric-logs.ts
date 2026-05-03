#!/usr/bin/env node --experimental-strip-types
// ─── Biometric Attendance Logs Import CLI ────────────────────────────────────
// Usage:
//   pnpm --filter @workspace/omega-dashboard run import-biometric -- <file> <year> <month>
//   pnpm --filter @workspace/omega-dashboard run import-biometric -- <file> <year> <month> --push
//   pnpm --filter @workspace/omega-dashboard run import-biometric -- <file> <year> <month> --push --force
//
// Example:
//   pnpm --filter @workspace/omega-dashboard run import-biometric -- ./data/AttendanceRecord.csv 2026 4 --push
// ─────────────────────────────────────────────────────────────────────────────

import * as fs   from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { pushBiometricLogsToSupabase } from '../src/lib/biometricLogImport.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

// Strip pnpm '--' separator
const args  = process.argv.slice(2).filter(a => a !== '--');
const flags = new Set(args.filter(a => a.startsWith('--')));

const positional = args.filter(a => !a.startsWith('--'));

if (positional.length < 3) {
  console.error('\nUsage: import-biometric <file> <year> <month> [--push] [--force]');
  console.error('  <file>    Path to AttendanceRecord CSV');
  console.error('  <year>    4-digit year');
  console.error('  <month>   Month number (1-12)');
  console.error('  --push    Write to Supabase');
  console.error('  --force   Re-import even if batch exists\n');
  process.exit(1);
}

const filePath = positional[0];
const year     = parseInt(positional[1], 10);
const month    = parseInt(positional[2], 10);
const push     = flags.has('--push');
const force    = flags.has('--force');

if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
  console.error('\nInvalid year or month.\n');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`\nFile not found: ${filePath}\n`);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\nMissing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env\n');
  process.exit(1);
}

const csvText = fs.readFileSync(filePath, 'utf-8');
const batchId = `biometric_${year}_${String(month).padStart(2, '0')}`;

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  OMEGA BIOMETRIC LOG IMPORT PIPELINE`);
console.log(`  File   : ${filePath}`);
console.log(`  Period : ${year}/${String(month).padStart(2, '0')}`);
console.log(`  Batch  : ${batchId}`);
console.log(`  Mode   : ${push ? 'PUSH → Supabase' : 'DRY RUN (no writes)'}`);
console.log(`  Force  : ${force ? 'YES (dedup bypassed)' : 'NO'}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

pushBiometricLogsToSupabase(csvText, year, month, {
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY,
  push,
  force
}).then(result => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  IMPORT RESULT SUMMARY`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Batch ID:              ${result.batchId}`);

  if (result.aborted) {
    console.warn(`\n  ⛔ ABORTED: ${result.abortReason}\n`);
    process.exit(0);
    return;
  }

  const s = result.summary;
  console.log(`  Employees parsed:      ${s.employeesParsed}`);
  console.log(`  Days parsed:           ${s.daysParsed}`);
  console.log(`  Logs generated:        ${s.logsGenerated}`);
  console.log(`    IN  logs:            ${s.inCount}`);
  console.log(`    OUT logs:            ${s.outCount}`);
  console.log(`  Missing OUT (anomaly): ${s.missingOutCount}`);
  console.log(`  Duplicate scans removed: ${s.duplicateScanCount}`);
  console.log(`  Skipped days (no data):  ${s.skippedDays}`);
  console.log(`  Upserted to DB:        ${result.logsUpserted}`);
  console.log(`  Errors:                ${result.errors.length}`);

  if (result.anomalies.length > 0) {
    console.log(`\n  ANOMALIES — Missing OUT (${result.anomalies.length}):`);
    result.anomalies.slice(0, 20).forEach(a => {
      console.log(`   ⚠  [${a.log_date}] ${a.employee_id.padEnd(8)} ${a.employee_name}`);
      console.log(`        Times: ${a.raw_times.join(', ')}`);
    });
    if (result.anomalies.length > 20) {
      console.log(`   … and ${result.anomalies.length - 20} more`);
    }
  }

  if (result.errors.length > 0) {
    console.log('\n  ERRORS:');
    result.errors.forEach(e => console.log(`   ✗  ${e}`));
    process.exit(1);
  }

  console.log(`\n  ✓ Pipeline complete.\n`);
}).catch(err => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
