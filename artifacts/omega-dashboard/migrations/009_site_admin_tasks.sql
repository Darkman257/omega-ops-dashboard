-- 009_site_admin_tasks.sql
-- Creates the site_admin_tasks table and updated_at trigger

CREATE TABLE IF NOT EXISTS site_admin_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  responsible_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  task_category TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE site_admin_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for public access (anon) - matching project pattern
DROP POLICY IF EXISTS "Allow anon select site_admin_tasks" ON site_admin_tasks;
DROP POLICY IF EXISTS "Allow anon insert site_admin_tasks" ON site_admin_tasks;
DROP POLICY IF EXISTS "Allow anon update site_admin_tasks" ON site_admin_tasks;
DROP POLICY IF EXISTS "Allow anon delete site_admin_tasks" ON site_admin_tasks;

CREATE POLICY "Allow anon select site_admin_tasks" ON site_admin_tasks FOR SELECT USING (true);
CREATE POLICY "Allow anon insert site_admin_tasks" ON site_admin_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update site_admin_tasks" ON site_admin_tasks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete site_admin_tasks" ON site_admin_tasks FOR DELETE USING (true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_site_admin_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_site_admin_tasks_updated_at_trg ON site_admin_tasks;
CREATE TRIGGER update_site_admin_tasks_updated_at_trg
BEFORE UPDATE ON site_admin_tasks
FOR EACH ROW
EXECUTE FUNCTION update_site_admin_tasks_updated_at();
