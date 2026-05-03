#!/usr/bin/env tsx
// ─── Attendance CSV Import CLI ─────────────────────────────────────────────────────
// Usage:
//   pnpm --filter @workspace/omega-dashboard exec tsx scripts/import-attendance-csv.ts \
//     ./data/april-attendance.csv 2026 4
//
//   --push  : Write to Supabase (default is dry-run)
//   --force : Re-import even if batch already exists
// ─────────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { importAttendanceCSV } from '../src/lib/attendanceImport.ts';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env vars loaded via --env-file flag in Node 20+ or from shell environment.
// Run: node --env-file=.env (handled by the pnpm exec command wrapper).

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Filter out '--' injected by pnpm when calling: pnpm run script -- arg1 arg2
const args = process.argv.slice(2).filter(a => a !== '--');

if (args.length < 3) {
  console.error('\nUsage: tsx scripts/import-attendance-csv.ts <csv-file> <year> <month> [--push] [--force]');
  console.error('  --push   Write to Supabase (default is dry-run)');
  console.error('  --force  Re-import even if batch already imported');
  console.error('Example: tsx scripts/import-attendance-csv.ts ./data/april.csv 2026 4 --push\n');
  process.exit(1);
}

const csvPath = args[0];
const year = parseInt(args[1], 10);
const month = parseInt(args[2], 10);
const push = args.includes('--push');
const force = args.includes('--force');

if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
  console.error('\nInvalid year or month. Year must be 4 digits, month must be 1-12.\n');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`\nFile not found: ${csvPath}\n`);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\nMissing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env\n');
  process.exit(1);
}

const rawCSV = fs.readFileSync(csvPath, 'utf-8');

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  OMEGA ATTENDANCE IMPORT PIPELINE`);
console.log(`  File  : ${csvPath}`);
console.log(`  Period: ${year}/${String(month).padStart(2, '0')}`);
console.log(`  Mode  : ${push ? 'PUSH → Supabase' : 'DRY RUN (no writes)'}`);
console.log(`  Force : ${force ? 'YES (dedup bypassed)' : 'NO (dedup active)'}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

importAttendanceCSV(rawCSV, year, month, SUPABASE_URL, SUPABASE_KEY, push, force)
  .then(result => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  IMPORT RESULT SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Batch ID:            ${result.batchId}`);
    console.log(`  File hash:           ${result.fileHash.slice(0, 16)}...`);
    console.log(`  Hash status:         ${result.hashStatus.toUpperCase()}`);

    if (result.aborted) {
      if (result.hashStatus === 'same_hash') {
        console.warn(`\n  ⛔ Same batch already imported — file unchanged.`);
        console.warn(`     To update with a new file, ensure the CSV is different and re-run.`);
        console.warn(`     To force re-import identical data, use --force.\n`);
      } else {
        console.warn(`\n  ⛔ IMPORT ABORTED: ${result.abortReason}`);
        console.warn('  Run with --force to bypass.\n');
      }
      process.exit(0);
      return;
    }

    if (result.hashStatus === 'hash_changed') {
      console.log(`\n  ℹ Batch updated with new data (file changed).`);
    } else if (result.hashStatus === 'new') {
      console.log(`\n  ✓ New batch — first import for this period.`);
    }

    console.log(`  Staff parsed:        ${result.staffParsed}`);
    console.log(`  Attendance parsed:   ${result.attendanceParsed}`);
    console.log(`  Staff upserted:      ${result.staffUpserted}`);
    console.log(`  Attendance upserted: ${result.attendanceUpserted}`);
    console.log(`  Warnings:            ${result.warningsCount}`);
    console.log(`  Errors:              ${result.errors.length}`);

    if (result.warnings.length > 0) {
      console.log('\n  WARNINGS:');
      result.warnings.forEach(w => console.log(`   ⚠  ${w}`));
    }

    if (result.errors.length > 0) {
      console.log('\n  ERRORS (REQUIRES MANUAL REVIEW):');
      result.errors.forEach(e => console.log(`   ✗  ${e}`));
      process.exit(1);
    }

    console.log('\n  ✓ Pipeline complete.\n');
  })
  .catch(err => {
    console.error('\n[FATAL ERROR]', err);
    process.exit(1);
  });
