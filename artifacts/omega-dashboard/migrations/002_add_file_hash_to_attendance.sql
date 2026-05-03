-- ─── Migration 002: Add file_hash column to attendance table ─────────────────
-- Safe to run even if migration 001 already added this column.
-- Included for explicit audit trail — no-op if column already exists.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS file_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_attendance_batch_hash
  ON attendance(import_batch_id, file_hash);
