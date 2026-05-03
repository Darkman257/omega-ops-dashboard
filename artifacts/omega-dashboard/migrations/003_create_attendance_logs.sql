-- ─── Migration 003: Biometric Attendance Logs ────────────────────────────────
-- Stores raw parsed biometric punch events (IN / OUT per employee per day).
-- Separate from the monthly attendance sheet table.
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS attendance_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    TEXT NOT NULL,
  log_date       DATE NOT NULL,
  timestamp_in   TIMESTAMP WITH TIME ZONE,
  timestamp_out  TIMESTAMP WITH TIME ZONE,
  duration_hours NUMERIC(5, 2),         -- out - in in hours, null if incomplete
  anomaly        TEXT,                   -- 'missing_in' | 'missing_out' | null
  source         TEXT DEFAULT 'biometric',
  import_batch_id TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(employee_id, log_date, import_batch_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_logs_date        ON attendance_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_logs_employee    ON attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_logs_batch       ON attendance_logs(import_batch_id);

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
