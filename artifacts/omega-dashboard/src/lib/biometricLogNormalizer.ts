// ─── Biometric Log Normalizer ─────────────────────────────────────────────────
// Parses AttendanceRecord grid exports from biometric machines.
//
// Expected grid format (CSV/text):
//   Col 0: employee_id
//   Col 1: employee_name
//   Col 2: department
//   Col 3+: day columns (day 1 = col 3, day 2 = col 4, ...)
//
// Each day cell contains 0-N punch times (newline or space separated):
//   "08:15\n12:30\n17:45"  →  [08:15, 12:30, 17:45]
//   First unique time = IN, Last unique time = OUT
//   If only 1 unique time = IN only + anomaly: missing_out
//   If 0 times = skip day
//
// Output rows are individual IN / OUT events, stored in attendance_logs.
// ─────────────────────────────────────────────────────────────────────────────

export interface AttendanceLogRecord {
  employee_id: string;
  employee_name: string;
  log_date: string;           // YYYY-MM-DD
  timestamp: string;          // ISO 8601 — the IN or OUT event time
  type: 'in' | 'out';
  raw_times: string[];        // all raw punch times for the day (audit trail)
  source: 'biometric';
  import_batch_id: string;
}

export interface BiometricAnomaly {
  employee_id: string;
  employee_name: string;
  log_date: string;
  type: 'missing_out' | 'missing_in' | 'no_punches';
  raw_times: string[];
}

export interface NormalizerSummary {
  employeesParsed: number;
  daysParsed: number;
  logsGenerated: number;
  inCount: number;
  outCount: number;
  missingOutCount: number;
  duplicateScanCount: number;
  skippedDays: number;
}

export interface BiometricNormalizerOutput {
  logs: AttendanceLogRecord[];
  anomalies: BiometricAnomaly[];
  summary: NormalizerSummary;
}

// ─── Column layout ────────────────────────────────────────────────────────────
const COL_EMPLOYEE_ID   = 0;
const COL_EMPLOYEE_NAME = 1;
const COL_DEPARTMENT    = 2;   // not used, kept for layout reference
const COL_DAYS_START    = 3;   // day 1 = col 3, day 2 = col 4, ...

// ─── Time pattern: HH:MM or HH:MM:SS ─────────────────────────────────────────
const TIME_PATTERN = /\b([0-1]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/g;

// ─── Parse all time tokens from a raw cell string ────────────────────────────
function extractTimes(cellValue: string): string[] {
  const cleaned = cellValue.replace(/\r?\n/g, ' ').trim();
  const matches: string[] = [];
  let m: RegExpExecArray | null;

  TIME_PATTERN.lastIndex = 0;  // reset global regex state
  while ((m = TIME_PATTERN.exec(cleaned)) !== null) {
    const hh = m[1].padStart(2, '0');
    const mm = m[2];
    const ss = m[3] ?? '00';
    matches.push(`${hh}:${mm}:${ss}`);
  }

  return matches;
}

// ─── Build ISO timestamp from date parts + time string ───────────────────────
function buildTimestamp(year: number, month: number, day: number, time: string): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}T${time}`;   // naive local — Supabase stores as-is in TIMESTAMPTZ
}

// ─── CSV row parser (handles quoted multi-line cells) ────────────────────────
function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split(/\r?\n/);
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { currentCell += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
      } else {
        currentCell += ch;
      }
    }

    if (inQuotes) {
      currentCell += '\n';           // newline inside a quoted cell
    } else {
      currentRow.push(currentCell);
      if (currentRow.some(c => c.trim() !== '')) rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    }
  }

  if (currentRow.length > 0 && currentRow.some(c => c.trim() !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

// ─── Main normalizer ──────────────────────────────────────────────────────────
export function normalizeBiometricLogs(
  rawCSV: string,
  year: number,
  month: number,
  batchId: string
): BiometricNormalizerOutput {
  const logs: AttendanceLogRecord[] = [];
  const anomalies: BiometricAnomaly[] = [];

  let employeesParsed    = 0;
  let daysParsed         = 0;
  let duplicateScanCount = 0;
  let missingOutCount    = 0;
  let skippedDays        = 0;

  const employeeIds = new Set<string>();
  const rows = parseCSVRows(rawCSV);
  const daysInMonth = new Date(year, month, 0).getDate();

  // ─── Step 1: Detect header row and extract actual day numbers ───────────────
  // The header row has "Employee ID" or "No" in col 0.
  // Day columns start at COL_DAYS_START and contain numeric day values.
  // e.g. "Employee ID,Name,Department,2,3" → dayMap[3]=2, dayMap[4]=3
  const dayMap = new Map<number, number>(); // colIndex → actual day number

  for (const row of rows) {
    const col0 = row[COL_EMPLOYEE_ID]?.trim().toLowerCase() ?? '';
    // Detect header row by checking col 0 is non-numeric and col 2 contains 'dept'
    // OR col 0 looks like "employee id" / "no" / "رقم"
    if (
      col0 === 'employee id' || col0 === 'no' || col0 === 'رقم' ||
      col0 === 'emp id' || col0 === 'employee no' ||
      (!col0 || isNaN(Number(col0)))  // col0 is text → likely a header
    ) {
      let foundDays = false;
      for (let c = COL_DAYS_START; c < row.length; c++) {
        const val = row[c]?.trim();
        if (!val) continue;
        const dayNum = parseInt(val, 10);
        if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
          dayMap.set(c, dayNum);
          foundDays = true;
        }
      }
      if (foundDays) break; // found the right header row
    }
  }

  // If no day header found, fall back to positional (day 1 = first column)
  const useHeaderDays = dayMap.size > 0;

  // ─── Step 2: Process data rows ───────────────────────────────────────────────
  for (const row of rows) {
    if (row.length < COL_DAYS_START + 1) continue;

    const employeeId   = row[COL_EMPLOYEE_ID]?.trim()   ?? '';
    const employeeName = row[COL_EMPLOYEE_NAME]?.trim()  ?? '';

    // Skip header / non-data rows
    if (!employeeId || isNaN(Number(employeeId))) continue;

    employeeIds.add(employeeId);

    // Iterate over day columns
    for (let col = COL_DAYS_START; col < row.length; col++) {
      // Resolve the actual day number
      const dayNumber = useHeaderDays
        ? (dayMap.get(col) ?? null)
        : (col - COL_DAYS_START + 1);

      if (dayNumber === null) continue;                 // unmapped column
      if (dayNumber < 1 || dayNumber > daysInMonth) continue;

      const cellValue = row[col] ?? '';
      const rawTimes  = extractTimes(cellValue);

      if (rawTimes.length === 0) {
        skippedDays++;
        continue;
      }

      daysParsed++;

      // Deduplicate keeping count of removed
      const unique = [...new Set(rawTimes)];
      duplicateScanCount += rawTimes.length - unique.length;

      // Sort ascending
      unique.sort();

      const logDate          = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      const rawTimesForAudit = rawTimes;  // preserve original (pre-dedup)

      if (unique.length === 1) {
        // Only one punch — create IN, flag missing_out
        logs.push({
          employee_id:     employeeId,
          employee_name:   employeeName,
          log_date:        logDate,
          timestamp:       buildTimestamp(year, month, dayNumber, unique[0]),
          type:            'in',
          raw_times:       rawTimesForAudit,
          source:          'biometric',
          import_batch_id: batchId
        });

        anomalies.push({
          employee_id:   employeeId,
          employee_name: employeeName,
          log_date:      logDate,
          type:          'missing_out',
          raw_times:     rawTimesForAudit
        });

        missingOutCount++;

      } else {
        // Multiple punches — first = IN, last = OUT
        const timeIn  = unique[0];
        const timeOut = unique[unique.length - 1];

        logs.push({
          employee_id:     employeeId,
          employee_name:   employeeName,
          log_date:        logDate,
          timestamp:       buildTimestamp(year, month, dayNumber, timeIn),
          type:            'in',
          raw_times:       rawTimesForAudit,
          source:          'biometric',
          import_batch_id: batchId
        });

        logs.push({
          employee_id:     employeeId,
          employee_name:   employeeName,
          log_date:        logDate,
          timestamp:       buildTimestamp(year, month, dayNumber, timeOut),
          type:            'out',
          raw_times:       rawTimesForAudit,
          source:          'biometric',
          import_batch_id: batchId
        });
      }
    }

    employeesParsed++;
  }

  const inCount  = logs.filter(l => l.type === 'in').length;
  const outCount = logs.filter(l => l.type === 'out').length;

  return {
    logs,
    anomalies,
    summary: {
      employeesParsed: employeeIds.size,
      daysParsed,
      logsGenerated:      logs.length,
      inCount,
      outCount,
      missingOutCount,
      duplicateScanCount,
      skippedDays
    }
  };
}
