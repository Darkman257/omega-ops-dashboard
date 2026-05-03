-- ─── Migration 002: Add file_hash column to attendance table ─────────────────
-- Run in Supabase SQL Editor AFTER migration 001.
-- Stores the SHA-256 hash of the imported CSV so re-imports with changed data
-- can be detected and allowed while identical re-imports are blocked.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- Index for fast hash lookups during deduplication check
CREATE INDEX IF NOT EXISTS idx_attendance_batch_hash
  ON attendance(import_batch_id, file_hash);
