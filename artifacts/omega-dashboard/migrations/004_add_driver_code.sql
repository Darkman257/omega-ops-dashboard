-- Add driver_code to vehicles table
-- Keeping driver name column for display purposes as requested

ALTER TABLE IF EXISTS vehicles
ADD COLUMN IF NOT EXISTS driver_code TEXT;

-- Create an index to quickly filter vehicles by driver_code
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_code ON vehicles(driver_code);
