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
  
  if (file.endsWith('.xlsx')) {
    if (!xlsx) {
      console.log(`  ✗ Cannot parse .xlsx without 'xlsx' package.`);
      process.exit(1);
    }
    
    const workbook = xlsx.readFile(file);
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        // Assume col 0 is building/location, 1 is unit, 2 is resident name, 3 is code
        // This is a generic guess as requested
        const building = String(row[0] || '').trim();
        const unit = String(row[1] || '').trim();
        const residentName = String(row[2] || '').trim();
        const providedCode = String(row[3] || '').trim();
        
        if (!unit && !residentName) continue;
        
        const unitKey = `${building}_${unit}`;
        if (unit && !units.has(unitKey)) {
          units.set(unitKey, {
            unit_number: unit,
            building: building,
            location: building, // fallback
            notes: `Imported from ${file.split('/').pop()}`
          });
        }
        
        if (residentName) {
          let code: string | null = providedCode || null;
          let status = 'pending_review';
          
          if (!code && residentName) {
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
          } else if (code) {
            status = 'linked';
          }
          
          residents.push({
            unit_number: unit,
            employee_name: residentName,
            employee_code: code,
            assignment_status: status
          });
        }
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
