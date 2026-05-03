// ─── Attendance Import Service ────────────────────────────────────────────────
// Reads raw CSV, normalizes it via attendanceNormalizer.ts, then upserts
// staff and attendance records into Supabase.
// No UI side-effects. No mock data. Strict TypeScript.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { normalizeAttendanceCSV, AttendanceStatus } from './attendanceNormalizer';

// ─── Compute SHA-256 fingerprint of raw CSV content ──────────────────────────
function computeFileHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export interface ImportResult {
  staffParsed: number;
  attendanceParsed: number;
  staffUpserted: number;
  attendanceUpserted: number;
  warningsCount: number;
  warnings: string[];
  errors: string[];
  batchId: string;
  fileHash: string;
  aborted: boolean;
  abortReason?: string;
  hashStatus: 'new' | 'same_hash' | 'hash_changed' | 'dry_run' | 'forced';
}

// ─── Supabase row types (DB schema contract) ──────────────────────────────────
interface StaffRow {
  internal_code: string;
  full_name: string;
  job_title: string;
  status: string;
}

interface AttendanceRow {
  employee_id: string;
  employee_name: string;
  date: string;           // ISO date string: YYYY-MM-DD
  status: AttendanceStatus;
  raw_value: string;
  source: string;
  import_batch_id: string;
  file_hash: string;
}

// ─── Build ISO date from month + day number ───────────────────────────────────
// The sheet is a monthly sheet — caller supplies year + month.
function buildDate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

// ─── Main import function ─────────────────────────────────────────────────────
export async function importAttendanceCSV(
  rawCSV: string,
  year: number,
  month: number,
  supabaseUrl: string,
  supabaseKey: string,
  push: boolean = false,
  force: boolean = false
): Promise<ImportResult> {
  // Deterministic batch ID: same month always gets same ID so duplicates can be detected
  const batchId = `import_${year}_${String(month).padStart(2, '0')}`;
  const fileHash = computeFileHash(rawCSV);

  const result: ImportResult = {
    staffParsed: 0,
    attendanceParsed: 0,
    staffUpserted: 0,
    attendanceUpserted: 0,
    warningsCount: 0,
    warnings: [],
    errors: [],
    batchId,
    fileHash,
    aborted: false,
    hashStatus: 'new'
  };

  // Step 1: Normalize
  const normalized = normalizeAttendanceCSV(rawCSV);
  result.staffParsed = normalized.staff.length;
  result.attendanceParsed = normalized.attendance.length;
  result.warningsCount = normalized.warnings.length;
  result.warnings = normalized.warnings;

  if (!push) {
    console.log(`[DRY RUN] Hash: ${fileHash}. Use --push to write to Supabase.`);
    result.hashStatus = 'dry_run';
    return result;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // ─── Hash-aware deduplication guard ──────────────────────────────────────
  if (force) {
    console.log(`[FORCE MODE] Bypassing dedup check. Hash: ${fileHash}`);
    result.hashStatus = 'forced';
  } else {
    const { data: existingBatch, error: checkError } = await supabase
      .from('attendance')
      .select('file_hash')
      .eq('import_batch_id', batchId)
      .limit(1);

    if (checkError) {
      const msg = `Deduplication check failed: ${checkError.message}`;
      console.error('[ERROR]', msg);
      result.errors.push(msg);
      result.aborted = true;
      result.abortReason = msg;
      return result;
    }

    if (existingBatch && existingBatch.length > 0) {
      const storedHash: string = existingBatch[0].file_hash ?? '';

      if (storedHash === fileHash) {
        // ✗ Identical file — block
        const reason = `Same batch already imported (batch: "${batchId}", hash: ${fileHash.slice(0, 12)}...). No changes detected.`;
        console.warn('[ABORTED]', reason);
        result.aborted = true;
        result.abortReason = reason;
        result.hashStatus = 'same_hash';
        result.warnings.push(reason);
        result.warningsCount = result.warnings.length;
        return result;
      } else {
        // ✓ Different file — allow with warning
        const warn = `Batch "${batchId}" exists but file has changed (old: ${storedHash.slice(0, 12)}..., new: ${fileHash.slice(0, 12)}...). Importing updated data.`;
        console.warn('[HASH CHANGED]', warn);
        result.warnings.push(warn);
        result.warningsCount = result.warnings.length;
        result.hashStatus = 'hash_changed';
      }
    } else {
      result.hashStatus = 'new';
    }
  }
  // Step 2: Upsert staff records
  const staffRows: StaffRow[] = normalized.staff.map(s => ({
    internal_code: s.employee_id,
    full_name: s.name,
    job_title: s.position,
    status: 'active'
  }));

  if (staffRows.length > 0) {
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .upsert(staffRows, { onConflict: 'internal_code' })
      .select();

    if (staffError) {
      const msg = `Staff upsert failed: ${staffError.message}`;
      console.error('[ERROR]', msg);
      result.errors.push(msg);
    } else {
      result.staffUpserted = staffData?.length ?? 0;
      console.log(`[STAFF] Upserted ${result.staffUpserted} records.`);
    }
  }

  // Step 3: Upsert attendance records
  const attendanceRows: AttendanceRow[] = normalized.attendance
    .filter(a => a.status !== 'off')
    .map(a => ({
      employee_id: a.employee_id,
      employee_name: a.name,
      date: buildDate(year, month, a.day),
      status: a.status,
      raw_value: a.raw_value,
      source: 'excel',
      import_batch_id: batchId,
      file_hash: fileHash
    }));

  // Insert in chunks of 500 to avoid payload limits
  const CHUNK_SIZE = 500;
  for (let i = 0; i < attendanceRows.length; i += CHUNK_SIZE) {
    const chunk = attendanceRows.slice(i, i + CHUNK_SIZE);
    const { data: attData, error: attError } = await supabase
      .from('attendance')
      .upsert(chunk, { onConflict: 'employee_id,date,import_batch_id' })
      .select();

    if (attError) {
      const msg = `Attendance upsert chunk [${i}..${i + chunk.length}] failed: ${attError.message}`;
      console.error('[ERROR]', msg);
      result.errors.push(msg);
    } else {
      result.attendanceUpserted += attData?.length ?? 0;
    }
  }

  console.log(`[ATTENDANCE] Upserted ${result.attendanceUpserted} records. Batch: ${batchId}`);
  return result;
}
