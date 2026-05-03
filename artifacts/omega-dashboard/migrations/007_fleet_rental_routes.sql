-- 007_fleet_rental_routes.sql
-- Adds necessary columns to track route information for rental vehicles.

ALTER TABLE IF EXISTS vehicles
ADD COLUMN IF NOT EXISTS route_name TEXT,
ADD COLUMN IF NOT EXISTS daily_rate TEXT,
ADD COLUMN IF NOT EXISTS passenger_count INTEGER DEFAULT 0;
