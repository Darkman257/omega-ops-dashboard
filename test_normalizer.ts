// Quick smoke-test for attendanceNormalizer.ts
// Run with: npx ts-node test_normalizer.ts
// (No build needed, no DB writes)

import { normalizeAttendanceCSV } from './artifacts/omega-dashboard/src/lib/attendanceNormalizer';
import * as fs from 'fs';

// Feed the raw CSV from the Google Sheet export
const rawCSV = fs.readFileSync('./test_attendance.csv', 'utf-8');
const result = normalizeAttendanceCSV(rawCSV);

console.log('\n=== STAFF RECORDS ===');
console.log(JSON.stringify(result.staff, null, 2));

console.log('\n=== SAMPLE ATTENDANCE (first 10) ===');
console.log(JSON.stringify(result.attendance.slice(0, 10), null, 2));

console.log(`\n=== TOTALS ===`);
console.log(`Staff:       ${result.staff.length}`);
console.log(`Attendance:  ${result.attendance.length} entries`);
console.log(`Warnings:    ${result.warnings.length}`);

if (result.warnings.length > 0) {
  console.log('\n=== WARNINGS ===');
  result.warnings.forEach(w => console.log(' -', w));
}
