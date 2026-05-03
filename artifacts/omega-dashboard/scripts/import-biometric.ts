#!/usr/bin/env node --experimental-strip-types
// ─── Biometric Attendance Import CLI ──────────────────────────────────────────
// Usage:
//   pnpm --filter @workspace/omega-dashboard run import-biometric -- <file> [--push]
//
//   <file>    Path to raw biometric export file
//   --push    Write to Supabase (default: dry run)
//
// Example:
//   pnpm --filter @workspace/omega-dashboard run import-biometric -- ./data/biometric-april.txt --push
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { importBiometricFile } from '../src/lib/biometricImport.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const args = process.argv.slice(2).filter(a => a !== '--');

if (args.length < 1 || args[0].startsWith('--')) {
  console.error('\nUsage: import-biometric <file> [--push]');
  console.error('  <file>   Path to biometric export file');
  console.error('  --push   Write to Supabase (default: dry run)\n');
  process.exit(1);
}

const filePath = args[0];
const push     = args.includes('--push');

if (!fs.existsSync(filePath)) {
  console.error(`\nFile not found: ${filePath}\n`);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\nMissing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env\n');
  process.exit(1);
}

// Build batch ID from file name + today's date
const fileName = path.basename(filePath, path.extname(filePath)).replace(/\s+/g, '_');
const today    = new Date().toISOString().split('T')[0];
const batchId  = `biometric_${fileName}_${today}`;

const rawContent = fs.readFileSync(filePath, 'utf-8');

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  OMEGA BIOMETRIC IMPORT PIPELINE`);
console.log(`  File  : ${filePath}`);
console.log(`  Batch : ${batchId}`);
console.log(`  Mode  : ${push ? 'PUSH → Supabase' : 'DRY RUN (no writes)'}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

importBiometricFile(rawContent, SUPABASE_URL, SUPABASE_KEY, batchId, push)
  .then(result => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  BIOMETRIC IMPORT RESULT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Batch ID:           ${result.batchId}`);
    console.log(`  Raw punches parsed: ${result.totalRawRecords}`);
    console.log(`  Employees detected: ${result.totalEmployees}`);
    console.log(`  Log records built:  ${result.anomalies.length + (result.logsUpserted || 0)}`);
    console.log(`  Upserted to DB:     ${result.logsUpserted}`);
    console.log(`  Anomalies:          ${result.anomalyCount}`);
    console.log(`  Skipped lines:      ${result.skippedLines.length}`);
    console.log(`  Errors:             ${result.errors.length}`);

    if (result.anomalies.length > 0) {
      console.log('\n  ANOMALIES (missing IN or OUT):');
      result.anomalies.forEach(a => {
        console.log(`   ⚠  [${a.log_date}] Employee ${a.employee_id.padEnd(10)} → ${a.anomaly}`);
        console.log(`        IN:  ${a.timestamp_in ?? '—'}`);
        console.log(`        OUT: ${a.timestamp_out ?? '—'}`);
      });
    }

    if (result.skippedLines.length > 0) {
      console.log('\n  SKIPPED LINES (unparseable):');
      result.skippedLines.slice(0, 10).forEach(l => console.log(`   –  ${l}`));
      if (result.skippedLines.length > 10) {
        console.log(`   … and ${result.skippedLines.length - 10} more`);
      }
    }

    if (result.errors.length > 0) {
      console.log('\n  ERRORS:');
      result.errors.forEach(e => console.log(`   ✗  ${e}`));
      process.exit(1);
    }

    console.log('\n  ✓ Pipeline complete.\n');
  })
  .catch(err => {
    console.error('\n[FATAL ERROR]', err);
    process.exit(1);
  });
