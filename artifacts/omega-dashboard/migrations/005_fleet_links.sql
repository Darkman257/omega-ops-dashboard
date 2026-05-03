-- Add extra columns to vehicles table for asset-human linking

ALTER TABLE IF EXISTS vehicles
ADD COLUMN IF NOT EXISTS source_file TEXT,
ADD COLUMN IF NOT EXISTS assignment_status TEXT DEFAULT 'pending_review';

-- Update assignment status for vehicles that already have a driver code
UPDATE vehicles 
SET assignment_status = 'linked' 
WHERE driver_code IS NOT NULL;
