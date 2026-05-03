// ─── Import Fleet Links ───────────────────────────────────────────────────────
// Parses vehicle Excel files, matches drivers to staff codes, and upserts vehicles.
//
// Usage:
//   DRY RUN: pnpm --filter @workspace/omega-dashboard run import-fleet-links -- ./data/أسماء\ سيارات\ المشروع\ وسائقينها.xlsx ./data/حصر\ سيارات\ ايجار\ مشروع\ دبي.xlsx
//   PUSH:    pnpm --filter @workspace/omega-dashboard run import-fleet-links -- ./data/أسماء\ سيارات\ المشروع\ وسائقينها.xlsx ./data/حصر\ سيارات\ ايجار\ مشروع\ دبي.xlsx --push
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const rawArgs  = process.argv.slice(2).filter(a => a !== '--');
const pushMode = rawArgs.includes('--push');
const files    = rawArgs.filter(a => !a.startsWith('--'));

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SEP      = '━'.repeat(80);

let xlsx: any;
try {
  xlsx = require('xlsx');
} catch (e) {
  // Gracefully handle if not installed
}

console.log(`\n${SEP}`);
console.log(`  OMEGA — IMPORT FLEET LINKS`);
console.log(`  Mode: ${pushMode ? 'PUSH → Supabase' : 'DRY RUN (no DB writes)'}`);
console.log(`  Time: ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

if (files.length === 0) {
  console.log(`  ⚠ No files provided.`);
  process.exit(1);
}

interface ParsedVehicle {
  car_name: string;
  plate_number: string;
  driver: string;
  driver_code: string | null;
  source_file: string;
  assignment_status: string;
}

async function run() {
  console.log(`  [1/3] Fetching staff list...`);
  const { data: staffData, error: staffErr } = await supabase
    .from('staff')
    .select('internal_code, full_name');

  if (staffErr) {
    console.error(`  ✗ Staff fetch failed: ${staffErr.message}`);
    process.exit(1);
  }

  const staffMap = new Map<string, string>(); // lowercase name -> code
  const exactCodeMap = new Set<string>();
  for (const s of staffData ?? []) {
    if (s.full_name && s.internal_code) {
      staffMap.set(s.full_name.trim().toLowerCase(), s.internal_code);
      exactCodeMap.add(s.internal_code);
    }
  }

  const parsedVehicles: ParsedVehicle[] = [];

  console.log(`\n  [2/3] Parsing files...`);
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.log(`  ✗ File not found: ${file}`);
      continue;
    }
    
    const fileName = file.split('/').pop() || file;

    if (file.endsWith('.xlsx')) {
      if (!xlsx) {
        console.log(`  ✗ Cannot parse ${fileName} without 'xlsx' package.`);
        continue;
      }
      
      const workbook = xlsx.readFile(file);
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
        
        // Skip header row
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          
          // Assuming columns: 0: Name/Type, 1: Plate, 2: Driver
          // The actual columns will depend on the real file, so we fallback gracefully
          const carName = String(row[0] || '').trim();
          const plate = String(row[1] || '').trim();
          const driver = String(row[2] || '').trim();
          
          if (!carName && !plate && !driver) continue;
          
          let code: string | null = null;
          let status = 'pending_review';
          
          if (driver) {
            const driverLower = driver.toLowerCase();
            // Try exact match
            if (staffMap.has(driverLower)) {
              code = staffMap.get(driverLower)!;
              status = 'linked';
            } else {
              // Try substring match
              for (const [staffName, staffCode] of staffMap.entries()) {
                if (staffName.includes(driverLower) || driverLower.includes(staffName)) {
                  code = staffCode;
                  status = 'linked';
                  break;
                }
              }
            }
          }
          
          parsedVehicles.push({
            car_name: carName || 'Unknown Vehicle',
            plate_number: plate || `NO_PLATE_${Math.floor(Math.random()*1000)}`,
            driver,
            driver_code: code,
            source_file: fileName,
            assignment_status: status
          });
        }
      }
    } else {
      console.log(`  ✗ Unsupported file format: ${fileName} (Use .xlsx)`);
    }
  }

  console.log(`\n  [3/3] Analysis Results\n`);
  
  let linked = 0;
  let pending = 0;
  for (const v of parsedVehicles) {
    if (v.assignment_status === 'linked') linked++;
    else pending++;
  }

  console.log(`  ${'Plate'.padEnd(15)} ${'Car'.padEnd(20)} ${'Driver'.padEnd(25)} Status`);
  console.log(`  ${'─'.repeat(75)}`);
  
  for (let i = 0; i < Math.min(parsedVehicles.length, 15); i++) {
    const v = parsedVehicles[i];
    const icon = v.assignment_status === 'linked' ? '✅' : '⚠';
    const codeStr = v.driver_code ? `(${v.driver_code})` : '';
    console.log(`  ${v.plate_number.slice(0, 13).padEnd(15)} ${v.car_name.slice(0, 18).padEnd(20)} ${v.driver.slice(0, 20).padEnd(25)} ${icon} ${codeStr}`);
  }
  
  if (parsedVehicles.length > 15) {
    console.log(`  ... and ${parsedVehicles.length - 15} more`);
  }

  console.log(`\n  ─── Summary ───`);
  console.log(`  Vehicles parsed: ${parsedVehicles.length}`);
  console.log(`  Drivers matched: ${linked}`);
  console.log(`  Pending drivers: ${pending}`);
  
  if (!pushMode) {
    console.log(`\n  ℹ DRY RUN — no data was written.`);
    console.log(`  Review the output above. If correct, re-run with --push`);
    console.log(`${SEP}\n`);
    process.exit(0);
  }

  if (parsedVehicles.length === 0) {
    console.log(`\n  ✅ No vehicles to push.`);
    process.exit(0);
  }
  
  console.log(`\n  Pushing to database...`);
  
  let errors = 0;
  for (const v of parsedVehicles) {
    const { error: upsertErr } = await supabase
      .from('vehicles')
      .upsert({
        plate_number: v.plate_number,
        car_name: v.car_name,
        driver: v.driver,
        driver_code: v.driver_code,
        source_file: v.source_file,
        assignment_status: v.assignment_status,
        status: 'Active'
      }, { onConflict: 'plate_number' });
      
    if (upsertErr) errors++;
  }
  
  console.log(`\n${SEP}`);
  console.log(`  IMPORT COMPLETE`);
  console.log(`  Upserted: ${parsedVehicles.length - errors}`);
  console.log(`  Errors:   ${errors}`);
  console.log(`${SEP}\n`);
}

run().catch(console.error);
