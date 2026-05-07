-- 010_employee_lifecycle_clearance.sql
-- Adds lifecycle and clearance fields to staff and creates clearance items table

-- 1. Update staff table with lifecycle fields
ALTER TABLE staff 
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS exit_date DATE,
  ADD COLUMN IF NOT EXISTS exit_reason TEXT,
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS clearance_status TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS housing_unit_id UUID REFERENCES housing_units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS onboarding_notes TEXT,
  ADD COLUMN IF NOT EXISTS offboarding_notes TEXT;

-- Add constraints for lifecycle_status and clearance_status if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_lifecycle_status_check') THEN
    ALTER TABLE staff ADD CONSTRAINT staff_lifecycle_status_check 
    CHECK (lifecycle_status IN ('active', 'onboarding', 'suspended', 'offboarding', 'inactive'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_clearance_status_check') THEN
    ALTER TABLE staff ADD CONSTRAINT staff_clearance_status_check 
    CHECK (clearance_status IN ('not_required', 'pending', 'in_progress', 'blocked', 'cleared'));
  END IF;
END $$;

-- 2. Create employee_clearance_items table
CREATE TABLE IF NOT EXISTS employee_clearance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  item_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'blocked', 'cleared')),
  notes TEXT,
  cleared_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  cleared_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Enable RLS
ALTER TABLE employee_clearance_items ENABLE ROW LEVEL SECURITY;

-- 4. Policies for public access (anon) - matching existing patterns
DROP POLICY IF EXISTS "Allow anon select employee_clearance_items" ON employee_clearance_items;
DROP POLICY IF EXISTS "Allow anon insert employee_clearance_items" ON employee_clearance_items;
DROP POLICY IF EXISTS "Allow anon update employee_clearance_items" ON employee_clearance_items;
DROP POLICY IF EXISTS "Allow anon delete employee_clearance_items" ON employee_clearance_items;

CREATE POLICY "Allow anon select employee_clearance_items" ON employee_clearance_items FOR SELECT USING (true);
CREATE POLICY "Allow anon insert employee_clearance_items" ON employee_clearance_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update employee_clearance_items" ON employee_clearance_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete employee_clearance_items" ON employee_clearance_items FOR DELETE USING (true);

-- 5. Updated at trigger
CREATE OR REPLACE FUNCTION update_employee_clearance_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_employee_clearance_items_updated_at_trg ON employee_clearance_items;
CREATE TRIGGER update_employee_clearance_items_updated_at_trg
BEFORE UPDATE ON employee_clearance_items
FOR EACH ROW
EXECUTE FUNCTION update_employee_clearance_items_updated_at();
