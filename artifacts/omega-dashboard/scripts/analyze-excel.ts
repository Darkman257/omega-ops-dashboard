// ─── Excel/CSV Audit Parser ───────────────────────────────────────────────────
// Reads the uploaded Excel files and prints their structure.
// Handles .xlsx if 'xlsx' package is installed, otherwise requires .csv fallback.
//
// Usage:
//   pnpm --filter @workspace/omega-dashboard run analyze-excel
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { convertXlsxToCsv } from './xlsx-to-csv.ts';

const files = [
  './data/الشقق (1).xlsx',
  './data/أسماء سيارات المشروع وسائقينها.xlsx',
  './data/حصر سيارات ايجار مشروع دبي.xlsx'
];

const SEP = '━'.repeat(80);

async function analyze() {
  console.log(`\n${SEP}`);
  console.log(`  OMEGA ASSET-HUMAN LINKING — FILE AUDIT`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log(`${SEP}\n`);

  let xlsx;
  try {
    // Attempt to dynamically load xlsx if installed
    xlsx = require('xlsx');
  } catch (e) {
    console.log(`  ⚠ 'xlsx' package not found. Falling back to CSV processing if available.`);
  }

  for (const file of files) {
    console.log(`\n  📁 File: ${file}`);
    console.log(`  ${'─'.repeat(75)}`);

    let targetFile = file;
    if (!fs.existsSync(targetFile)) {
      // Try CSV fallback
      const csvFallback = targetFile.replace('.xlsx', '.csv');
      if (fs.existsSync(csvFallback)) {
        console.log(`  ℹ .xlsx not found, using CSV fallback: ${csvFallback}`);
        targetFile = csvFallback;
      } else {
        console.log(`  ✗ File not found. Please upload it to the ./data/ directory.`);
        continue;
      }
    }

    if (targetFile.endsWith('.xlsx')) {
      if (!xlsx) {
        console.log(`  ⚠ 'xlsx' package missing. Attempting offline fallback conversion...`);
        const tempCsv = targetFile.replace('.xlsx', '.temp.csv');
        const success = convertXlsxToCsv(targetFile, tempCsv);
        if (success) {
          targetFile = tempCsv;
          // Fall through to CSV handling
        } else {
          console.log(`  ✗ Offline conversion failed. Please convert to .csv manually.`);
          continue;
        }
      } else {
        try {
          const workbook = xlsx.readFile(targetFile);
          console.log(`  Sheet Names: ${workbook.SheetNames.join(', ')}`);
          
          for (const sheetName of workbook.SheetNames) {
            console.log(`\n    📄 Sheet: ${sheetName}`);
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
            
            if (data.length === 0) {
              console.log(`      Empty sheet.`);
              continue;
            }
            
            const headers = data[0] as string[];
            console.log(`      Detected Columns: ${headers.join(' | ')}`);
            console.log(`      Total Rows: ${data.length}`);
            console.log(`\n      First 5 rows preview:`);
            data.slice(1, 6).forEach((row: any, i: number) => {
              console.log(`      [${i + 1}] ${JSON.stringify(row)}`);
            });
          }
        } catch (err: any) {
          console.log(`  ✗ Error parsing XLSX: ${err.message}`);
        }
        continue;
      }
    } 
    
    if (targetFile.endsWith('.csv')) {
      try {
        const raw = fs.readFileSync(targetFile, 'utf-8');
        const lines = raw.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length === 0) {
          console.log(`  Empty CSV.`);
          continue;
        }
        console.log(`  Detected Columns: ${lines[0]}`);
        console.log(`  Total Rows: ${lines.length}`);
        console.log(`\n  First 5 rows preview:`);
        lines.slice(1, 6).forEach((line, i) => {
          console.log(`  [${i + 1}] ${line}`);
        });
      } catch (err: any) {
        console.log(`  ✗ Error reading CSV: ${err.message}`);
      }
    }
  }
  
  console.log(`\n${SEP}\n`);
}

analyze().catch(console.error);
