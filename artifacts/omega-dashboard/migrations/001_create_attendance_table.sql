-- ─── Omega Dashboard: Attendance Table Migration ─────────────────────────────
-- Run this in Supabase SQL Editor (Database → SQL Editor → New Query)
-- Safe to run multiple times (idempotent).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS attendance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      TEXT NOT NULL,
  employee_name    TEXT,
  date             DATE NOT NULL,
  status           TEXT NOT NULL,
  raw_value        TEXT,
  source           TEXT DEFAULT 'excel',
  import_batch_id  TEXT,
  file_hash        TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns safely if table already existed without them
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS import_batch_id TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- Unique index (replaces inline UNIQUE constraint — idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_batch
  ON attendance(employee_id, date, import_batch_id);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_attendance_date     ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_batch_hash ON attendance(import_batch_id, file_hash);

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policies (no IF NOT EXISTS — drop first if re-running)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'attendance' AND policyname = 'Allow anon read attendance'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow anon read attendance" ON attendance FOR SELECT USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'attendance' AND policyname = 'Allow anon insert attendance'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow anon insert attendance" ON attendance FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

