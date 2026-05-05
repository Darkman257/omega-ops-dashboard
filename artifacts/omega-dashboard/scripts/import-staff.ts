import * as XLSX from "xlsx";
// @ts-ignore
const { readFile, utils } = (XLSX.default || XLSX) as any;
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Load environment variables (VITE_ prefixed as per project convention)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("\n❌ Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rawArgs = process.argv.slice(2).filter(a => a !== '--');
const filePath = rawArgs.find(a => !a.startsWith('--')) || "./data/omega_roster_import_ready.xlsx";

if (!fs.existsSync(filePath)) {
  console.error(`\n❌ File not found: ${filePath}\n`);
  process.exit(1);
}

const workbook = readFile(filePath);
const sheetName = "Ready_Import";
const sheet = workbook.Sheets[sheetName];

if (!sheet) {
  console.error(`\n❌ Sheet "${sheetName}" not found in ${filePath}`);
  console.log("Available sheets:", workbook.SheetNames, "\n");
  process.exit(1);
}

const data: any[] = utils.sheet_to_json(sheet);

(async () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   OMEGA STAFF IMPORT");
  console.log(`   File:  ${filePath}`);
  console.log(`   Rows:  ${data.length}`);
  console.log(`   Time:  ${new Date().toISOString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  const pick = (item: any, ...keys: string[]) => {
    for (const k of keys) {
      const v = item[k];
      if (v !== undefined && v !== "" && v !== null) return v;
    }
    return undefined;
  };

  for (const row of data) {
    // Robust mapping for name and job
    const fullName = pick(row, "full_name", "الاسم", "Name", "name", "employee_name");
    const jobTitle = pick(row, "job_title", "الوظيفة", "Role", "role", "job_code", "المسمى");
    const internalCode = pick(row, "internal_code", "id", "code", "الرقم الوظيفي", "كود", "م");
    const hireDate = pick(row, "hire_date", "بداية التعيين", "تاريخ التعيين", "Hire Date");

    // Validation: Required fields for a valid staff record
    if (!fullName || !jobTitle) {
      console.log(`⚠️  Skipped row (missing name or job):`, JSON.stringify(row).slice(0, 100) + "...");
      skippedCount++;
      continue;
    }

    // Prepare payload
    const payload: any = {
      full_name: String(fullName).trim(),
      job_title: String(jobTitle).trim(),
      internal_code: String(internalCode || '').trim(),
      status: 'active',
      department: pick(row, "department", "القسم", "Dept") || 'General'
    };

    // Mapping hire_date
    if (hireDate) {
      // Excel dates can be numbers. If it's a number, convert it to a string date.
      if (typeof hireDate === "number") {
        const date = new Date((hireDate - 25569) * 86400 * 1000);
        payload.hire_date = date.toISOString().split("T")[0];
      } else {
        payload.hire_date = String(hireDate);
      }
    }

    // Determine the unique key for upsert
    // We prefer internal_code if it exists, otherwise full_name (dangerous but fallback)
    const conflictKey = payload.internal_code ? "internal_code" : "full_name";

    const { error } = await supabase
      .from("staff")
      .upsert(payload, { onConflict: conflictKey });

    if (error) {
      console.error(`❌ Error upserting ${payload.full_name}:`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Success: [${payload.internal_code || "NEW"}] ${payload.full_name}`);
      successCount++;
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   IMPORT SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Inserted/Updated: ${successCount}`);
  console.log(`   Skipped:          ${skippedCount}`);
  console.log(`   Errors:           ${errorCount}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (errorCount > 0) {
    process.exit(1);
  }
})();
