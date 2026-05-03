-- ─── Migration 003: Biometric Attendance Logs ────────────────────────────────
-- Stores individual IN / OUT events from biometric machine exports.
-- Each row = one event (one IN or one OUT) for one employee.
-- Completely separate from the monthly attendance summary table.
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop old schema if it exists with wrong columns (schema change)
-- If you already ran the old version, run this first:
-- DROP TABLE IF EXISTS attendance_logs;

CREATE TABLE IF NOT EXISTS attendance_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     TEXT NOT NULL,
  employee_name   TEXT,
  log_date        DATE NOT NULL,
  timestamp       TIMESTAMP WITH TIME ZONE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('in', 'out')),
  raw_times       TEXT[],                  -- all raw punch times for this day (audit)
  source          TEXT DEFAULT 'biometric',
  import_batch_id TEXT NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique: one IN and one OUT per employee per day per batch
CREATE UNIQUE INDEX IF NOT EXISTS attendance_logs_unique_event
  ON attendance_logs (employee_id, timestamp, type, import_batch_id);

-- Lookup indexes
CREATE INDEX IF NOT EXISTS attendance_logs_employee_date_idx
  ON attendance_logs (employee_id, log_date);

CREATE INDEX IF NOT EXISTS attendance_logs_batch_idx
  ON attendance_logs (import_batch_id);

-- RLS
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'attendance_logs' AND policyname = 'Allow anon read logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow anon read logs" ON attendance_logs FOR SELECT TO anon USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'attendance_logs' AND policyname = 'Allow anon insert logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow anon insert logs" ON attendance_logs FOR INSERT TO anon WITH CHECK (true)';
  END IF;
END $$;
