// ─── Biometric File Parser ────────────────────────────────────────────────────
// Parses raw biometric device export files into structured IN/OUT log records.
//
// Supported formats:
//   TAB-delimited:  employee_id \t datetime \t device_id \t event_type
//   CSV:            employee_id, datetime, device_id, event_type
//   Bare:           employee_id datetime (2-column with space/tab)
//
// All formats auto-detected. Timestamps accepted in:
//   ISO 8601:   2026-04-01T08:23:45
//   Datetime:   2026-04-01 08:23:45
//   Date + sep: 01/04/2026 08:23:45
// ─────────────────────────────────────────────────────────────────────────────

export interface BiometricRawRecord {
  employee_id: string;
  timestamp: Date;
  raw_line: string;
}

export interface AttendanceLogRecord {
  employee_id: string;
  log_date: string;          // YYYY-MM-DD
  timestamp_in: string | null;    // ISO timestamp
  timestamp_out: string | null;   // ISO timestamp
  duration_hours: number | null;  // rounded to 2 decimal places
  anomaly: 'missing_in' | 'missing_out' | null;
  source: 'biometric';
  import_batch_id: string;
}

export interface BiometricParseResult {
  logs: AttendanceLogRecord[];
  anomalies: AttendanceLogRecord[];
  skippedLines: string[];
  totalRawRecords: number;
  totalEmployees: number;
}

// ─── Timestamp parser — handles multiple common formats ───────────────────────
function parseTimestamp(raw: string): Date | null {
  const cleaned = raw.trim();

  // Try ISO 8601 or space-separated datetime directly
  const direct = new Date(cleaned);
  if (!isNaN(direct.getTime())) return direct;

  // Try DD/MM/YYYY HH:MM:SS
  const dmyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/);
  if (dmyMatch) {
    const [, d, m, y, time] = dmyMatch;
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${time}`);
  }

  // Try MM/DD/YYYY HH:MM:SS
  const mdyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/);
  if (mdyMatch) {
    const [, m, d, y, time] = mdyMatch;
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${time}`);
  }

  return null;
}

// ─── Line parser — handles TAB, CSV, space-separated ─────────────────────────
function parseLine(line: string, lineNum: number): BiometricRawRecord | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return null;

  // Determine delimiter
  let parts: string[];
  if (trimmed.includes('\t')) {
    parts = trimmed.split('\t').map(p => p.trim());
  } else if (trimmed.includes(',')) {
    parts = trimmed.split(',').map(p => p.trim());
  } else {
    // Space-delimited: assume first token = employee_id, rest = timestamp
    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx === -1) return null;
    parts = [trimmed.slice(0, spaceIdx), trimmed.slice(spaceIdx + 1)];
  }

  if (parts.length < 2) return null;

  const employee_id = parts[0].trim();
  if (!employee_id || isNaN(Number(employee_id)) && !/^\w+$/.test(employee_id)) return null;

  // Try each remaining column as a timestamp
  let timestamp: Date | null = null;
  for (let i = 1; i < parts.length; i++) {
    timestamp = parseTimestamp(parts[i]);
    if (timestamp) break;
    // Try combining adjacent parts (e.g. date in col 1, time in col 2)
    if (i + 1 < parts.length) {
      timestamp = parseTimestamp(`${parts[i]} ${parts[i + 1]}`);
      if (timestamp) break;
    }
  }

  if (!timestamp) return null;

  return { employee_id, timestamp, raw_line: line };
}

// ─── ISO date string helper ───────────────────────────────────────────────────
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ─── Main parser ──────────────────────────────────────────────────────────────
export function parseBiometricFile(
  rawContent: string,
  batchId: string
): BiometricParseResult {
  const skippedLines: string[] = [];
  const rawRecords: BiometricRawRecord[] = [];

  const lines = rawContent.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const record = parseLine(line, i + 1);
    if (!record) {
      // Only track non-empty unparseable lines
      if (line.trim()) skippedLines.push(`Line ${i + 1}: "${line.trim()}"`);
      continue;
    }
    rawRecords.push(record);
  }

  // ─── Group by employee_id + date ──────────────────────────────────────────
  // Key: `${employee_id}__${YYYY-MM-DD}`
  const groups = new Map<string, Date[]>();

  for (const rec of rawRecords) {
    const dateStr = toDateStr(rec.timestamp);
    const key = `${rec.employee_id}__${dateStr}`;
    const existing = groups.get(key) ?? [];
    existing.push(rec.timestamp);
    groups.set(key, existing);
  }

  const logs: AttendanceLogRecord[] = [];
  const anomalies: AttendanceLogRecord[] = [];
  const employeeIds = new Set<string>();

  for (const [key, timestamps] of groups.entries()) {
    const [employee_id, log_date] = key.split('__');
    employeeIds.add(employee_id);

    // Deduplicate and sort ascending
    const unique = [...new Set(timestamps.map(t => t.getTime()))]
      .sort((a, b) => a - b)
      .map(t => new Date(t));

    const first = unique[0];                             // IN
    const last  = unique[unique.length - 1];             // OUT (same as IN if only 1 punch)

    const hasSinglePunch = unique.length === 1;
    const anomaly: AttendanceLogRecord['anomaly'] = hasSinglePunch ? 'missing_out' : null;

    const timestamp_in  = first?.toISOString() ?? null;
    const timestamp_out = hasSinglePunch ? null : (last?.toISOString() ?? null);

    let duration_hours: number | null = null;
    if (first && last && !hasSinglePunch) {
      const diffMs = last.getTime() - first.getTime();
      duration_hours = Math.round((diffMs / 3_600_000) * 100) / 100;
    }

    const log: AttendanceLogRecord = {
      employee_id,
      log_date,
      timestamp_in,
      timestamp_out,
      duration_hours,
      anomaly,
      source: 'biometric',
      import_batch_id: batchId
    };

    if (anomaly) {
      anomalies.push(log);
    }

    logs.push(log);
  }

  return {
    logs,
    anomalies,
    skippedLines,
    totalRawRecords: rawRecords.length,
    totalEmployees: employeeIds.size
  };
}
