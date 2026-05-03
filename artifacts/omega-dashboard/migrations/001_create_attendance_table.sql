-- ─── Omega Dashboard: Attendance Table Migration ─────────────────────────────
-- Run this in Supabase SQL editor (Database → SQL Editor → New Query)
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
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(employee_id, date, import_batch_id)
);

-- Index for fast daily lookups (used by dashboard metrics)
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);

-- Enable Row Level Security (match existing tables)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Allow anon read (matches existing project pattern)
CREATE POLICY IF NOT EXISTS "Allow anon read attendance"
  ON attendance FOR SELECT
  USING (true);

-- Allow anon insert (for import pipeline)
CREATE POLICY IF NOT EXISTS "Allow anon insert attendance"
  ON attendance FOR INSERT
  WITH CHECK (true);
