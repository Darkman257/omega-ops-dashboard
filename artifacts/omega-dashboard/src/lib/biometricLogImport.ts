// ─── Biometric Log Import Service ────────────────────────────────────────────
// Parses raw AttendanceRecord CSV via biometricLogNormalizer.ts, then upserts
// IN/OUT events into the attendance_logs Supabase table.
//
// Public API:
//   parseBiometricLogs(csvText, year, month)
//   pushBiometricLogsToSupabase(csvText, year, month, options)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { normalizeBiometricLogs } from './biometricLogNormalizer.ts';
import type {
  AttendanceLogRecord,
  BiometricAnomaly,
  NormalizerSummary
} from './biometricLogNormalizer.ts';

// ─── Public result type ───────────────────────────────────────────────────────
export interface BiometricImportResult {
  batchId: string;
  push: boolean;
  aborted: boolean;
  abortReason?: string;
  summary: NormalizerSummary;
  anomalies: BiometricAnomaly[];
  logsUpserted: number;
  errors: string[];
}

// ─── Parse only (no Supabase) ─────────────────────────────────────────────────
export function parseBiometricLogs(
  csvText: string,
  year: number,
  month: number
): { logs: AttendanceLogRecord[]; anomalies: BiometricAnomaly[]; summary: NormalizerSummary } {
  const batchId = `biometric_${year}_${String(month).padStart(2, '0')}`;
  return normalizeBiometricLogs(csvText, year, month, batchId);
}

// ─── Chunk upsert helper ──────────────────────────────────────────────────────
const CHUNK_SIZE = 500;

async function upsertChunks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  rows: AttendanceLogRecord[],
  errors: string[]
): Promise<number> {
  let upserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from('attendance_logs')
      .upsert(chunk as unknown[], {
        onConflict: 'employee_id,timestamp,type,import_batch_id'
      })
      .select();

    if (error) {
      const msg = `Chunk [${i}..${i + chunk.length}] upsert failed: ${error.message}`;
      console.error('[ERROR]', msg);
      errors.push(msg);
    } else {
      upserted += data?.length ?? 0;
    }
  }

  return upserted;
}

// ─── Main push function ───────────────────────────────────────────────────────
export async function pushBiometricLogsToSupabase(
  csvText: string,
  year: number,
  month: number,
  options: {
    supabaseUrl: string;
    supabaseKey: string;
    push?: boolean;
    force?: boolean;
  }
): Promise<BiometricImportResult> {
  const { supabaseUrl, supabaseKey, push = false, force = false } = options;

  const batchId = `biometric_${year}_${String(month).padStart(2, '0')}`;
  const errors: string[] = [];

  // Step 1: Parse
  const { logs, anomalies, summary } = normalizeBiometricLogs(csvText, year, month, batchId);

  const result: BiometricImportResult = {
    batchId,
    push,
    aborted: false,
    summary,
    anomalies,
    logsUpserted: 0,
    errors
  };

  if (!push) {
    console.log(`[DRY RUN] Parsed ${logs.length} log events. Use --push to write to Supabase.`);
    return result;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 2: Deduplication guard
  if (!force) {
    const { data: existing, error: checkError } = await supabase
      .from('attendance_logs')
      .select('import_batch_id')
      .eq('import_batch_id', batchId)
      .limit(1);

    if (checkError) {
      const msg = `Dedup check failed: ${checkError.message}`;
      errors.push(msg);
      result.aborted = true;
      result.abortReason = msg;
      return result;
    }

    if (existing && existing.length > 0) {
      const reason = `Batch "${batchId}" already imported. Use --force to re-import.`;
      console.warn('[ABORTED]', reason);
      result.aborted = true;
      result.abortReason = reason;
      return result;
    }
  } else {
    console.log(`[FORCE] Bypassing dedup check for batch: ${batchId}`);
  }

  // Step 3: Upsert
  if (logs.length === 0) {
    const msg = 'No valid log records parsed — nothing to insert.';
    console.warn('[ABORTED]', msg);
    result.aborted = true;
    result.abortReason = msg;
    return result;
  }

  result.logsUpserted = await upsertChunks(supabase, logs, errors);
  console.log(`[BIOMETRIC] Upserted ${result.logsUpserted} log records. Batch: ${batchId}`);

  return result;
}
