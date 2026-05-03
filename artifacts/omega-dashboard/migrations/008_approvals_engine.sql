-- 008_approvals_engine.sql
-- Creates the approvals table and links triggers to housing and fleet

CREATE TABLE IF NOT EXISTS approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'Pending',
  requester TEXT,
  requested_date DATE DEFAULT CURRENT_DATE,
  reviewed_by TEXT,
  reviewed_date DATE,
  notes TEXT,
  amount NUMERIC DEFAULT 0,
  linked_record_id UUID,
  linked_table TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select approvals" ON approvals;
DROP POLICY IF EXISTS "Allow anon insert approvals" ON approvals;
DROP POLICY IF EXISTS "Allow anon update approvals" ON approvals;

CREATE POLICY "Allow anon select approvals" ON approvals FOR SELECT USING (true);
CREATE POLICY "Allow anon insert approvals" ON approvals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update approvals" ON approvals FOR UPDATE USING (true) WITH CHECK (true);

-- Trigger for housing assignments
CREATE OR REPLACE FUNCTION trg_housing_approval() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.assignment_status = 'pending_review' OR NEW.employee_code = 'PENDING' THEN
      INSERT INTO approvals (title, type, status, requester, notes, linked_record_id, linked_table)
      VALUES (
        'Housing Assignment Review: ' || NEW.employee_name,
        'Housing',
        'Pending',
        'System Import',
        'Please verify and link employee code for resident ' || NEW.employee_name,
        NEW.id,
        'housing_assignments'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS housing_assignment_approval_trg ON housing_assignments;
CREATE TRIGGER housing_assignment_approval_trg
AFTER INSERT ON housing_assignments
FOR EACH ROW
EXECUTE FUNCTION trg_housing_approval();

-- Trigger for vehicles
CREATE OR REPLACE FUNCTION trg_vehicle_approval() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.driver_code IS NULL OR NEW.assignment_status = 'pending_review' THEN
      INSERT INTO approvals (title, type, status, requester, notes, linked_record_id, linked_table)
      VALUES (
        'Vehicle Driver Review: ' || NEW.plate_number,
        'Fleet',
        'Pending',
        'System Import',
        'Please verify and link driver code for driver ' || COALESCE(NEW.driver, 'Unknown') || ' (Vehicle: ' || NEW.plate_number || ')',
        NEW.id,
        'vehicles'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vehicle_approval_trg ON vehicles;
CREATE TRIGGER vehicle_approval_trg
AFTER INSERT ON vehicles
FOR EACH ROW
EXECUTE FUNCTION trg_vehicle_approval();
