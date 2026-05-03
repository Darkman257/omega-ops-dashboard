// ─── Attendance Normalizer ────────────────────────────────────────────────────
// Transforms raw CSV attendance rows into clean structured JSON records.
// Input format: raw CSV from Google Sheet (Arabic, multi-line cells, positional columns)
// Output format: AttendanceRecord[]
// ─────────────────────────────────────────────────────────────────────────────

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'excused_absence'
  | 'permitted_leave'
  | 'offsite'
  | 'sick'
  | 'night_shift'
  | 'rest_day'
  | 'off'
  | 'transferred'
  | 'compensatory'
  | 'unknown';

export interface AttendanceRecord {
  employee_id: string;
  name: string;
  position: string;
  day: number;
  status: AttendanceStatus;
  raw_value: string;
}

export interface StaffRecord {
  employee_id: string;
  name: string;
  position: string;
  net_days: number | null;
  overtime_days: number | null;
}

export interface NormalizedOutput {
  staff: StaffRecord[];
  attendance: AttendanceRecord[];
  warnings: string[];
}

// ─── Step 1: Clean multi-line cell values ────────────────────────────────────
function cleanCellValue(raw: string): string {
  return raw
    .replace(/\r\n|\n|\r/g, ' ') // collapse newlines into space
    .replace(/\s{2,}/g, ' ')     // collapse multiple spaces
    .trim();
}

// ─── Step 2: Normalize Arabic attendance codes → standard status ─────────────
function normalizeStatus(raw: string): AttendanceStatus {
  const cleaned = cleanCellValue(raw).trim();

  if (!cleaned || cleaned === '') return 'off';
  if (cleaned === '√') return 'present';
  if (cleaned === 'ج') return 'absent';
  if (cleaned.startsWith('غياب بإذن') || cleaned === 'غياب') return 'excused_absence';
  if (cleaned.startsWith('إذن')) return 'permitted_leave';
  if (cleaned === 'بنك') return 'offsite';
  if (cleaned === 'مرضى') return 'sick';
  if (cleaned === 'ليلى' || cleaned === 'ليلي') return 'night_shift';
  if (cleaned.startsWith('بدل راحة') || cleaned === 'بدل نسيم') return 'rest_day';
  if (cleaned.startsWith('بدل')) return 'compensatory';
  if (cleaned.startsWith('شم نسيم') || cleaned === 'شم نسيم') return 'rest_day';
  if (cleaned.startsWith('نقل')) return 'transferred';
  if (cleaned === 'مأمورية مشروع أسوان') return 'offsite';
  if (cleaned === 'إدارة') return 'offsite';
  if (cleaned === 'مرور') return 'offsite';
  if (cleaned.startsWith('نصف يوم')) return 'permitted_leave';
  if (cleaned.startsWith('بدل 4')) return 'compensatory'; // بدل 4/3 etc

  return 'unknown';
}

// ─── Step 3: Parse raw CSV text into rows of cells ───────────────────────────
function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split(/\r?\n/);
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (inQuotes) {
      // Multi-line cell: the newline is part of the cell value
      currentCell += '\n';
    } else {
      // End of row
      currentRow.push(currentCell);
      if (currentRow.some(c => c.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    }
  }

  // Flush any remaining
  if (currentRow.length > 0 && currentRow.some(c => c.trim() !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

// ─── Step 4: Main normalizer function ────────────────────────────────────────
// Column layout (0-indexed):
//   0: serial number
//   1: name
//   2: position
//   3: employee_id
//   4: overtime_days
//   5: unknown (deduction?)
//   6: net_days
//   7: unknown count
//   8: status flag (ج indicator)
//   9: blank separator / attendance grid starts at 10
//   10+: day-by-day attendance (day 1 = col 10, day 2 = col 11, ...)
const ATTENDANCE_START_COL = 10;

export function normalizeAttendanceCSV(rawCSV: string): NormalizedOutput {
  const warnings: string[] = [];
  const staffMap = new Map<string, StaffRecord>();
  const attendance: AttendanceRecord[] = [];

  const rows = parseCSVRows(rawCSV);

  for (const row of rows) {
    // Skip rows that clearly don't have enough columns or look like headers
    if (row.length < 10) continue;

    const serial = cleanCellValue(row[0] ?? '');
    if (!serial || isNaN(Number(serial))) continue; // skip non-data rows

    const name = cleanCellValue(row[1] ?? '');
    const position = cleanCellValue(row[2] ?? '');
    const employeeId = cleanCellValue(row[3] ?? '');
    const overtimeDays = row[4] !== undefined && row[4].trim() !== ''
      ? Number(row[4].trim())
      : null;
    const netDays = row[6] !== undefined && row[6].trim() !== ''
      ? Number(row[6].trim())
      : null;

    if (!name || !employeeId) {
      warnings.push(`Row ${serial}: Missing name or employee_id — skipped.`);
      continue;
    }

    // Register staff record (once per employee)
    if (!staffMap.has(employeeId)) {
      staffMap.set(employeeId, {
        employee_id: employeeId,
        name,
        position,
        net_days: isNaN(netDays as number) ? null : netDays,
        overtime_days: isNaN(overtimeDays as number) ? null : overtimeDays
      });
    }

    // Process daily attendance columns
    for (let col = ATTENDANCE_START_COL; col < row.length; col++) {
      const dayNumber = col - ATTENDANCE_START_COL + 1;
      const rawCell = row[col] ?? '';
      const cleaned = cleanCellValue(rawCell);
      const status = normalizeStatus(cleaned);

      if (status === 'unknown' && cleaned !== '') {
        warnings.push(`Employee ${employeeId} (${name}) — Day ${dayNumber}: unrecognized value "${cleaned}"`);
      }

      attendance.push({
        employee_id: employeeId,
        name,
        position,
        day: dayNumber,
        status,
        raw_value: cleaned
      });
    }
  }

  return {
    staff: Array.from(staffMap.values()),
    attendance,
    warnings
  };
}
