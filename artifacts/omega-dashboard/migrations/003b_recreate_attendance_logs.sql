-- ─── Remediation: Drop and recreate attendance_logs with correct schema ────────
-- Run this in Supabase SQL Editor.
--
-- Context: The old migration 003 created attendance_logs with timestamp_in/out
-- columns. The new schema uses individual IN/OUT rows (timestamp + type).
-- The table was empty (0 rows), so safe to drop and recreate.
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Drop old table (empty — safe)
DROP TABLE IF EXISTS attendance_logs;

-- Step 2: Recreate with correct schema
CREATE TABLE attendance_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     TEXT NOT NULL,
  employee_name   TEXT,
  log_date        DATE NOT NULL,
  timestamp       TIMESTAMP WITH TIME ZONE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('in', 'out')),
  raw_times       TEXT[],
  source          TEXT DEFAULT 'biometric',
  import_batch_id TEXT NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 3: Indexes
CREATE UNIQUE INDEX attendance_logs_unique_event
  ON attendance_logs (employee_id, timestamp, type, import_batch_id);

CREATE INDEX attendance_logs_employee_date_idx
  ON attendance_logs (employee_id, log_date);

CREATE INDEX attendance_logs_batch_idx
  ON attendance_logs (import_batch_id);

-- Step 4: RLS
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read logs"
  ON attendance_logs FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert logs"
  ON attendance_logs FOR INSERT TO anon WITH CHECK (true);
