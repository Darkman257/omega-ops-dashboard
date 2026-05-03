-- Create Housing Units table
CREATE TABLE IF NOT EXISTS housing_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number TEXT,
  building TEXT,
  location TEXT,
  capacity INTEGER DEFAULT 0,
  occupants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  source_file TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure we can add to it later if it already exists
ALTER TABLE IF EXISTS housing_units ADD COLUMN IF NOT EXISTS source_file TEXT;

-- Create Housing Assignments table
CREATE TABLE IF NOT EXISTS housing_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  housing_unit_id UUID REFERENCES housing_units(id) ON DELETE CASCADE,
  employee_code TEXT NOT NULL,
  employee_name TEXT,
  assignment_status TEXT DEFAULT 'linked',
  source_file TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Prevent duplicate assignments
CREATE UNIQUE INDEX IF NOT EXISTS housing_assignments_unique
ON housing_assignments (housing_unit_id, employee_code);

-- Enable RLS
ALTER TABLE housing_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_assignments ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be created similar to other tables
CREATE POLICY "Allow all read access for housing_units" ON housing_units FOR SELECT USING (true);
CREATE POLICY "Allow all write access for housing_units" ON housing_units FOR ALL USING (true);

CREATE POLICY "Allow all read access for housing_assignments" ON housing_assignments FOR SELECT USING (true);
CREATE POLICY "Allow all write access for housing_assignments" ON housing_assignments FOR ALL USING (true);
