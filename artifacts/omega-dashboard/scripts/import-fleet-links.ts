// ─── Import Fleet Links ───────────────────────────────────────────────────────
// Parses vehicle Excel files, matches drivers to staff codes, and upserts vehicles.
//
// Usage:
//   DRY RUN: pnpm --filter @workspace/omega-dashboard run import-fleet-links -- ./data/أسماء\ سيارات\ المشروع\ وسائقينها.xlsx ./data/حصر\ سيارات\ ايجار\ مشروع\ دبي.xlsx
//   PUSH:    pnpm --filter @workspace/omega-dashboard run import-fleet-links -- ./data/أسماء\ سيارات\ المشروع\ وسائقينها.xlsx ./data/حصر\ سيارات\ ايجار\ مشروع\ دبي.xlsx --push
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { convertXlsxToCsv } from './xlsx-to-csv.ts';

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
  route_name?: string;
  daily_rate?: string;
  passenger_count?: number;
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

    let data: string[][] = [];

    if (file.endsWith('.xlsx')) {
      if (!xlsx) {
        console.log(`  ⚠ 'xlsx' package missing. Attempting offline fallback conversion...`);
        const tempCsv = file.replace('.xlsx', '.temp.csv');
        const success = convertXlsxToCsv(file, tempCsv);
        if (success) {
          const raw = fs.readFileSync(tempCsv, 'utf-8');
          data = raw.split(/\r?\n/).map(line => {
            // simple csv split ignoring quotes for now since we generated it
            const cols = [];
            let inQuotes = false;
            let current = '';
            for (let i = 0; i < line.length; i++) {
              if (line[i] === '"') {
                inQuotes = !inQuotes;
              } else if (line[i] === ',' && !inQuotes) {
                cols.push(current);
                current = '';
              } else {
                current += line[i];
              }
            }
            cols.push(current);
            return cols;
          });
        } else {
          console.log(`  ✗ Cannot parse ${fileName} without 'xlsx' package.`);
          continue;
        }
      } else {
        const workbook = xlsx.readFile(file);
        // just take the first sheet for simplicity, or all sheets combined
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
          data.push(...sheetData);
        }
      }

      // Process the extracted 2D array data
      if (fileName.includes('ايجار')) {
        let currentRouteName = '';
        let currentRouteId = '';
        let currentCarName = '';
        let currentRate = '';
        let currentDriver = '';
        let passengersCount = 0;
        let routeDriverCode: string | null = null;
        let status = 'pending_review';

        const saveCurrentRoute = () => {
          if (currentRouteId && passengersCount > 0) {
            parsedVehicles.push({
              car_name: currentCarName || 'Unknown Vehicle',
              plate_number: currentRouteId, // Route ID used as plate
              driver: currentDriver || 'Route Driver',
              driver_code: routeDriverCode,
              source_file: fileName,
              assignment_status: status,
              route_name: currentRouteName,
              daily_rate: currentRate,
              passenger_count: passengersCount
            });
          }
        };

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          
          const col0 = String(row[0] || '').trim();
          const col1 = String(row[1] || '').trim();
          const col2 = String(row[2] || '').trim();
          const col3 = String(row[3] || '').trim();
          const col4 = String(row[4] || '').trim();
          
          if (col0.includes('خط') || col1.includes('خط')) {
            saveCurrentRoute();
            currentRouteName = col0.includes('خط') ? col0 : col1;
            passengersCount = 0;
            currentCarName = '';
            currentRate = '';
            currentDriver = '';
            routeDriverCode = null;
            status = 'pending_review';
            
            if (currentRouteName.includes('المنيب')) currentRouteId = 'ROUTE_RING_MOUNIB';
            else if (currentRouteName.includes('قليوب')) currentRouteId = 'ROUTE_QALYUB_RING';
            else if (currentRouteName.includes('العاصمة') && !currentRouteName.includes('30')) currentRouteId = 'ROUTE_BADR_CAPITAL_14';
            else if (currentRouteName.includes('30')) currentRouteId = 'ROUTE_BADR_CAPITAL_30';
            else if (currentRouteName.includes('بدر')) currentRouteId = 'ROUTE_BADR_MORNING';
            else currentRouteId = `ROUTE_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            continue;
          }
          
          if (col1.includes('اسماء') || col0 === 'م' || col1 === '') continue;
          
          passengersCount++;
          
          if (!currentCarName && col3) currentCarName = col3;
          if (!currentRate && col4) currentRate = col4;
          
          if (col2 === 'سائق' || col1.includes('سائق')) {
            currentDriver = col1;
            const driverLower = currentDriver.toLowerCase();
            if (staffMap.has(driverLower)) {
              routeDriverCode = staffMap.get(driverLower)!;
              status = 'linked';
            } else {
              for (const [staffName, staffCode] of staffMap.entries()) {
                if (staffName.includes(driverLower) || driverLower.includes(staffName)) {
                  routeDriverCode = staffCode;
                  status = 'linked';
                  break;
                }
              }
            }
          }
        }
        saveCurrentRoute();
      } else {
        // Normal fleet vehicles
        for (let i = 1; i < data.length; i++) { // Skip header
          const row = data[i];
          if (!row || row.length === 0) continue;
          
          const carName = String(row[1] || '').trim();
          const driver = String(row[2] || '').trim();
          const plate = String(row[3] || '').trim();
          
          if (!carName && !driver && !plate) continue;
  
          const ignoreWords = ['لا يوجد', 'الاسم', 'إسم السائق', 'اسماء الموظفين', 'الوظيفة'];
          if (!driver || ignoreWords.includes(driver)) continue;
            
          let code: string | null = null;
          let status = 'pending_review';
          
          const driverLower = driver.toLowerCase();
          if (staffMap.has(driverLower)) {
            code = staffMap.get(driverLower)!;
            status = 'linked';
          } else {
            for (const [staffName, staffCode] of staffMap.entries()) {
              if (staffName.includes(driverLower) || driverLower.includes(staffName)) {
                code = staffCode;
                status = 'linked';
                break;
              }
            }
          }
            
          parsedVehicles.push({
            car_name: carName || 'Unknown Vehicle',
            plate_number: plate || `NO_PLATE_${Math.floor(Math.random()*1000)}`,
            driver: driver,
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
  let upserted = 0;

  // First fetch existing vehicles to manually map them
  const { data: existingDbVehicles } = await supabase.from('vehicles').select('id, plate_number');
  const existingMap = new Map();
  if (existingDbVehicles) {
    for (const v of existingDbVehicles) {
      if (v.plate_number) {
        existingMap.set(v.plate_number.trim().toLowerCase(), v.id);
      }
    }
  }

  for (const v of parsedVehicles) {
    const key = (v.plate_number || '').trim().toLowerCase();
    
    if (existingMap.has(key)) {
      // Update existing record
      const { error: updateErr } = await supabase
        .from('vehicles')
        .update({
          car_name: v.car_name,
          driver: v.driver,
          driver_code: v.driver_code,
          source_file: v.source_file,
          assignment_status: v.assignment_status,
          status: 'Active',
          route_name: v.route_name || null,
          daily_rate: v.daily_rate || null,
          passenger_count: v.passenger_count || 0
        })
        .eq('id', existingMap.get(key));
        
      if (updateErr) {
        console.error(`  ✗ Error updating ${v.plate_number}: ${updateErr.message}`);
        errors++;
      } else {
        upserted++;
      }
    } else {
      // Insert new record
      const { error: insertErr } = await supabase
        .from('vehicles')
        .insert({
          plate_number: v.plate_number,
          car_name: v.car_name,
          driver: v.driver,
          driver_code: v.driver_code,
          source_file: v.source_file,
          assignment_status: v.assignment_status,
          status: 'Active',
          route_name: v.route_name || null,
          daily_rate: v.daily_rate || null,
          passenger_count: v.passenger_count || 0
        });
        
      if (insertErr) {
        console.error(`  ✗ Error inserting ${v.plate_number}: ${insertErr.message}`);
        errors++;
      } else {
        upserted++;
      }
    }
  }
  
  console.log(`\n${SEP}`);
  console.log(`  IMPORT COMPLETE`);
  console.log(`  Upserted/Updated: ${upserted}`);
  console.log(`  Errors:           ${errors}`);
  console.log(`${SEP}\n`);
}

run().catch(console.error);
