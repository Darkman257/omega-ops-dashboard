import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndTest() {
  console.log("1. Checking if site_admin_tasks exists...");
  const { data, error } = await supabase.from('site_admin_tasks').select('*').limit(1);
  
  if (error) {
    if (error.code === '42P01') {
      console.log("Table does NOT exist. Migration not applied.");
      process.exit(0);
    } else {
      console.error("Error querying table:", error);
      process.exit(1);
    }
  }
  
  console.log("Table EXISTS. Migration is applied.");
  
  console.log("2. Inserting test task...");
  // Try to find a project and staff
  const { data: projects } = await supabase.from('projects').select('id').limit(1);
  const { data: staff } = await supabase.from('staff').select('id').limit(1);
  
  const projectId = projects?.[0]?.id || null;
  const staffId = staff?.[0]?.id || null;
  
  const testTask = {
    project_id: projectId,
    responsible_staff_id: staffId,
    task_category: 'Other',
    task_title: 'TEST TASK - VERIFICATION',
    status: 'pending',
    priority: 'low',
    notes: 'This is a test task to verify the new module.'
  };
  
  const { data: inserted, error: insertError } = await supabase
    .from('site_admin_tasks')
    .insert([testTask])
    .select()
    .single();
    
  if (insertError) {
    console.error("Insert failed (RLS issues?):", insertError);
    process.exit(1);
  }
  
  console.log("Inserted test task ID:", inserted.id);
  
  console.log("3. Deleting test task...");
  const { error: deleteError } = await supabase
    .from('site_admin_tasks')
    .delete()
    .eq('id', inserted.id);
    
  if (deleteError) {
    console.error("Delete failed:", deleteError);
    process.exit(1);
  }
  
  console.log("Deleted test task successfully.");
  console.log("All verifications passed!");
}

checkAndTest();
