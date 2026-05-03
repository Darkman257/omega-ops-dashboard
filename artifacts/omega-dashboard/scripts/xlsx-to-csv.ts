// ─── Minimal Offline XLSX to CSV Converter ──────────────────────────────────
// Extracts data from .xlsx without requiring the 'xlsx' npm package.
// Uses native 'unzip' and parses XML with regex.
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siRegex = /<si>(.*?)<\/si>/gs;
  let match;
  while ((match = siRegex.exec(xml)) !== null) {
    const siContent = match[1];
    const tRegex = /<t[^>]*>(.*?)<\/t>/gs;
    let tMatch;
    let combined = '';
    while ((tMatch = tRegex.exec(siContent)) !== null) {
      combined += tMatch[1];
    }
    // Decode basic XML entities
    combined = combined.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    strings.push(combined);
  }
  return strings;
}

function getColIndex(colStr: string): number {
  let index = 0;
  for (let i = 0; i < colStr.length; i++) {
    index = index * 26 + (colStr.charCodeAt(i) - 64);
  }
  return index - 1;
}

function parseSheet(xml: string, sharedStrings: string[]): string[][] {
  const data: string[][] = [];
  const rowRegex = /<row[^>]*>(.*?)<\/row>/gs;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowContent = rowMatch[1];
    const cRegex = /<c ([^>]*)>.*?<v>(.*?)<\/v>.*?<\/c>/gs;
    let cMatch;
    const rowData: string[] = [];
    while ((cMatch = cRegex.exec(rowContent)) !== null) {
      const cAttrs = cMatch[1];
      const vStr = cMatch[2];
      
      const rMatch = /r="([A-Z]+)[0-9]+"/.exec(cAttrs);
      const tMatch = /t="([^"]+)"/.exec(cAttrs);
      
      const colStr = rMatch ? rMatch[1] : 'A';
      const tStr = tMatch ? tMatch[1] : '';
      
      const colIndex = getColIndex(colStr);
      let value = vStr;
      
      if (tStr === 's') {
        const strIndex = parseInt(vStr, 10);
        value = sharedStrings[strIndex] || '';
      }
      
      // Pad empty columns
      while (rowData.length < colIndex) {
        rowData.push('');
      }
      rowData[colIndex] = value;
    }
    data.push(rowData);
  }
  return data;
}

export function convertXlsxToCsv(filePath: string, outputCsvPath: string) {
  const tmpDir = `/tmp/xlsx_extract_${Date.now()}`;
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
    execSync(`unzip -q -o "${filePath}" -d "${tmpDir}"`);
    
    let sharedStrings: string[] = [];
    const ssPath = path.join(tmpDir, 'xl', 'sharedStrings.xml');
    if (fs.existsSync(ssPath)) {
      const ssXml = fs.readFileSync(ssPath, 'utf-8');
      sharedStrings = parseSharedStrings(ssXml);
    }
    
    const sheetPath = path.join(tmpDir, 'xl', 'worksheets', 'sheet1.xml');
    if (!fs.existsSync(sheetPath)) {
      throw new Error("Could not find sheet1.xml");
    }
    
    const sheetXml = fs.readFileSync(sheetPath, 'utf-8');
    const rows = parseSheet(sheetXml, sharedStrings);
    
    const csvContent = rows.map(r => 
      r.map(cell => {
        const escaped = (cell || '').replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    ).join('\n');
    
    fs.writeFileSync(outputCsvPath, csvContent, 'utf-8');
    return true;
  } catch (err: any) {
    console.error(`Error converting ${filePath}:`, err.message);
    return false;
  } finally {
    execSync(`rm -rf "${tmpDir}"`);
  }
}
