// ─── Biometric Import Service ─────────────────────────────────────────────────
// Parses raw biometric file via biometricParser.ts, then upserts attendance_logs
// into Supabase. Strict error reporting — no silent failures.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { parseBiometricFile } from './biometricParser.ts';
import type { AttendanceLogRecord } from './biometricParser.ts';

export interface BiometricImportResult {
  batchId: string;
  totalRawRecords: number;
  totalEmployees: number;
  logsUpserted: number;
  anomalyCount: number;
  anomalies: AttendanceLogRecord[];
  skippedLines: string[];
  errors: string[];
  aborted: boolean;
}

// ─── Chunk insert helper ──────────────────────────────────────────────────────
const CHUNK_SIZE = 500;

async function upsertInChunks(
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
      .upsert(chunk as unknown[], { onConflict: 'employee_id,log_date,import_batch_id' })
      .select();

    if (error) {
      const msg = `Upsert chunk [${i}..${i + chunk.length}] failed: ${error.message}`;
      console.error('[ERROR]', msg);
      errors.push(msg);
    } else {
      upserted += data?.length ?? 0;
    }
  }
  return upserted;
}

// ─── Main import function ─────────────────────────────────────────────────────
export async function importBiometricFile(
  rawContent: string,
  supabaseUrl: string,
  supabaseKey: string,
  batchId: string,
  push: boolean = false
): Promise<BiometricImportResult> {
  const errors: string[] = [];

  // Step 1: Parse
  const parsed = parseBiometricFile(rawContent, batchId);

  const result: BiometricImportResult = {
    batchId,
    totalRawRecords: parsed.totalRawRecords,
    totalEmployees: parsed.totalEmployees,
    logsUpserted: 0,
    anomalyCount: parsed.anomalies.length,
    anomalies: parsed.anomalies,
    skippedLines: parsed.skippedLines,
    errors,
    aborted: false
  };

  if (!push) {
    console.log('[DRY RUN] Biometric parse complete. Use --push to write to Supabase.');
    return result;
  }

  if (parsed.logs.length === 0) {
    const msg = 'No valid records parsed. Aborting insert.';
    console.warn('[ABORTED]', msg);
    result.aborted = true;
    errors.push(msg);
    return result;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 2: Upsert to attendance_logs
  result.logsUpserted = await upsertInChunks(supabase, parsed.logs, errors);
  console.log(`[BIOMETRIC] Upserted ${result.logsUpserted} log records. Batch: ${batchId}`);

  return result;
}
