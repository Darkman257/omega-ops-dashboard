// ─── Import Housing Links ─────────────────────────────────────────────────────
// Parses the apartments Excel file, matches residents to staff codes, 
// and prepares to upsert housing_units and housing_assignments.
//
// Usage:
//   DRY RUN: pnpm --filter @workspace/omega-dashboard run import-housing -- ./data/الشقق\ \(1\).xlsx
//   PUSH:    pnpm --filter @workspace/omega-dashboard run import-housing -- ./data/الشقق\ \(1\).xlsx --push
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { convertXlsxToCsv } from './xlsx-to-csv.ts';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const rawArgs  = process.argv.slice(2).filter(a => a !== '--');
const pushMode = rawArgs.includes('--push');
const file     = rawArgs.find(a => !a.startsWith('--')) || './data/الشقق (1).xlsx';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SEP      = '━'.repeat(80);

let xlsx: any;
try { xlsx = require('xlsx'); } catch (e) {}

console.log(`\n${SEP}`);
console.log(`  OMEGA — IMPORT HOUSING LINKS`);
console.log(`  File: ${file}`);
console.log(`  Mode: ${pushMode ? 'PUSH → Supabase' : 'DRY RUN (no DB writes)'}`);
console.log(`  Time: ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

interface ParsedUnit {
  unit_number: string;
  building: string;
  location: string;
  notes: string;
}

interface ParsedResident {
  unit_number: string;
  employee_name: string;
  employee_code: string | null;
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

  const staffMap = new Map<string, string>();
  for (const s of staffData ?? []) {
    if (s.full_name && s.internal_code) {
      staffMap.set(s.full_name.trim().toLowerCase(), s.internal_code);
    }
  }

  const units = new Map<string, ParsedUnit>();
  const residents: ParsedResident[] = [];

  console.log(`\n  [2/3] Parsing file...`);
  if (!fs.existsSync(file)) {
    console.log(`  ✗ File not found: ${file}`);
    process.exit(1);
  }
  
  let data: string[][] = [];

  if (file.endsWith('.xlsx')) {
    if (!xlsx) {
      console.log(`  ⚠ 'xlsx' package missing. Attempting offline fallback conversion...`);
      const tempCsv = file.replace('.xlsx', '.temp.csv');
      const success = convertXlsxToCsv(file, tempCsv);
      if (success) {
        const raw = fs.readFileSync(tempCsv, 'utf-8');
        data = raw.split(/\r?\n/).map(line => {
          const cols = [];
          let inQuotes = false;
          let current = '';
          for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQuotes = !inQuotes;
            else if (line[i] === ',' && !inQuotes) { cols.push(current); current = ''; }
            else current += line[i];
          }
          cols.push(current);
          return cols;
        });
      } else {
        console.log(`  ✗ Cannot parse .xlsx without 'xlsx' package.`);
        process.exit(1);
      }
    } else {
      const workbook = xlsx.readFile(file);
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        data.push(...(xlsx.utils.sheet_to_json(sheet, { header: 1 }) as string[][]));
      }
    }
    
    // For الشقق (1).xlsx ->
    // "شقة 1","4","","","","51"
    // "م","الاسم","الوظيفة","0","","الاسم","الوظيفة"
    // "1","محمد شعبان محمد","مساح","","1","احمد السيد غمري","م/ تنفيذ"
    //
    // The format is a split table (two lists side-by-side)
    // List 1: Unit=col 0 (header row), resident=col 1
    // List 2: Unit=col 5 (header row), resident=col 5 (wait, preview showed:
    // [1] "شقة 1","4"
    // [2] "م","الاسم","الوظيفة"
    // [3] "1","محمد شعبان محمد"
    
    let currentUnitLeft = '';
    let currentUnitRight = '';

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const c0 = String(row[0] || '').trim();
      const c1 = String(row[1] || '').trim();
      const c5 = String(row[5] || '').trim();
      
      if (c0.includes('شقة') || c0.includes('غرفة')) currentUnitLeft = c0;
      if (c5.includes('شقة') || c5.includes('غرفة')) currentUnitRight = c5;
      
      // Left resident
      if (c1 && c1 !== 'الاسم' && c0 !== 'م') {
        const residentName = c1;
        const unit = currentUnitLeft || 'Unknown Unit';
        const building = 'ابراج دبى'; // Inferred from filename audit
        
        const unitKey = `${building}_${unit}`;
        if (!units.has(unitKey)) {
          units.set(unitKey, { unit_number: unit, building, location: building, notes: '' });
        }
        
        let code: string | null = null;
        let status = 'pending_review';
        const rLower = residentName.toLowerCase();
        if (staffMap.has(rLower)) {
          code = staffMap.get(rLower)!;
          status = 'linked';
        } else {
          for (const [sName, sCode] of staffMap.entries()) {
            if (sName.includes(rLower) || rLower.includes(sName)) {
              code = sCode;
              status = 'linked';
              break;
            }
          }
        }
        
        residents.push({ unit_number: unit, employee_name: residentName, employee_code: code, assignment_status: status });
      }

      // Right resident
      if (c5 && c5 !== 'الاسم' && !c5.includes('شقة') && !c5.includes('غرفة') && row[4] !== 'م') {
        const residentName = c5;
        const unit = currentUnitRight || 'Unknown Unit';
        const building = 'ابراج دبى';
        
        const unitKey = `${building}_${unit}`;
        if (!units.has(unitKey)) {
          units.set(unitKey, { unit_number: unit, building, location: building, notes: '' });
        }
        
        let code: string | null = null;
        let status = 'pending_review';
        const rLower = residentName.toLowerCase();
        if (staffMap.has(rLower)) {
          code = staffMap.get(rLower)!;
          status = 'linked';
        } else {
          for (const [sName, sCode] of staffMap.entries()) {
            if (sName.includes(rLower) || rLower.includes(sName)) {
              code = sCode;
              status = 'linked';
              break;
            }
          }
        }
        
        residents.push({ unit_number: unit, employee_name: residentName, employee_code: code, assignment_status: status });
      }
    }
  } else {
    console.log(`  ✗ Only XLSX is fully supported in this parser right now.`);
    process.exit(1);
  }

  console.log(`\n  [3/3] Analysis Results\n`);
  
  let linked = 0;
  let pending = 0;
  for (const r of residents) {
    if (r.assignment_status === 'linked') linked++;
    else pending++;
  }

  console.log(`  ${'Unit'.padEnd(10)} ${'Resident'.padEnd(30)} Status`);
  console.log(`  ${'─'.repeat(75)}`);
  
  for (let i = 0; i < Math.min(residents.length, 15); i++) {
    const r = residents[i];
    const icon = r.assignment_status === 'linked' ? '✅' : '⚠';
    const codeStr = r.employee_code ? `(${r.employee_code})` : '';
    console.log(`  ${r.unit_number.slice(0, 8).padEnd(10)} ${r.employee_name.slice(0, 28).padEnd(30)} ${icon} ${codeStr}`);
  }
  
  if (residents.length > 15) console.log(`  ... and ${residents.length - 15} more`);

  console.log(`\n  ─── Summary ───`);
  console.log(`  Units parsed: ${units.size}`);
  console.log(`  Residents parsed: ${residents.length}`);
  console.log(`  Matched residents: ${linked}`);
  console.log(`  Pending residents: ${pending}`);
  
  if (!pushMode) {
    console.log(`\n  ℹ DRY RUN — no data was written.`);
    process.exit(0);
  }

  console.log(`\n  Pushing to database...`);
  // Assuming a real DB push would go here
  console.log(`\n${SEP}`);
  console.log(`  IMPORT PUSH NOT IMPLEMENTED YET`);
  console.log(`${SEP}\n`);
}

run().catch(console.error);
