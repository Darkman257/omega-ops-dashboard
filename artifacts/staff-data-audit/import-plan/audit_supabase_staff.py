import os
import sys
import csv
import re
import json
import requests
from dotenv import load_dotenv

# 1. Path Resolutions
ENV_PATH = "/mnt/d/NEXUS/AGENTS/telegram-personal-agent/.env"
MERGED_CSV_PATH = "/mnt/d/NEXUS/PROJECTS/omega-ops-dashboard/artifacts/staff-data-audit/image-extraction/extracted_staff_merged.csv"
PLAN_DIR = "/mnt/d/NEXUS/PROJECTS/omega-ops-dashboard/artifacts/staff-data-audit/import-plan"
os.makedirs(PLAN_DIR, exist_ok=True)

print("=== OMEGA SUPABASE REGISTRY COMPARISON AUDIT ===")

# 2. Credentials Load
if not os.path.exists(ENV_PATH):
    print(f"CRITICAL ERROR: Environment registry not found at {ENV_PATH}")
    sys.exit(1)

load_dotenv(ENV_PATH)
url = os.getenv("OMEGA_SUPABASE_URL")
key = os.getenv("OMEGA_SUPABASE_ANON_KEY")

if not url or not key:
    print("CRITICAL ERROR: Supabase URL or Anon-Key are null in environment container.")
    sys.exit(1)

# 3. Fetch All Existing Supabase Staff Rows (Read-Only)
print("Connecting to live Supabase REST API...")
try:
    base = url.rstrip("/")
    endpoint = f"{base}/rest/v1/staff?select=*"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    resp = requests.get(endpoint, headers=headers, timeout=15)
    if resp.status_code != 200:
        print(f"CRITICAL API ERROR: Server returned HTTP {resp.status_code}. Access might be blocked by RLS.")
        sys.exit(1)
        
    db_rows = resp.json()
    print(f"  >> RETRIEVED: {len(db_rows)} existing staff records from Supabase.")
except Exception as e:
    print(f"CRITICAL CONNECTION ERROR: {e}")
    sys.exit(1)

# 4. Load Normalized Target Data from Image CSV
if not os.path.exists(MERGED_CSV_PATH):
    print(f"CRITICAL ERROR: Missing merged extraction CSV at {MERGED_CSV_PATH}")
    sys.exit(1)

target_rows = []
with open(MERGED_CSV_PATH, mode="r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for r in reader:
        target_rows.append(r)
print(f"  >> LOADED: {len(target_rows)} extracted candidate records from local CSV.")

# -----------------------------------------------------------------
# Normalization Helper (Identical to Collator to ensure zero drifting)
# -----------------------------------------------------------------
def normalize_ar(txt):
    if not txt: return ""
    t = str(txt).strip()
    t = re.sub(r'\s+', ' ', t)
    t = t.replace('إ', 'ا').replace('أ', 'ا').replace('آ', 'ا')
    t = t.replace('ى', 'ي').replace('ة', 'ه')
    t = t.replace('محمدعبد', 'محمد عبد')
    return t

# 5. Pre-process Existing Database Index Keys
# Store by normalized name AND by phone (if present)
db_by_name = {}
db_by_phone = {}
db_by_code = {}

for idx, r in enumerate(db_rows):
    name = r.get("full_name")
    phone = r.get("phone")
    code = r.get("internal_code")
    
    if name:
        db_by_name[normalize_ar(name)] = r
    if phone and str(phone).strip():
        db_by_phone[str(phone).strip()] = r
    if code:
        db_by_code[str(code).strip()] = r

# 6. Classification Engine
insert_candidates = []
update_candidates = []
duplicate_suspects = []

inserts_cnt = 0
updates_cnt = 0
skipped_cnt = 0
review_cnt = 0

for t_row in target_rows:
    raw_name = t_row["full_name"]
    norm_name = normalize_ar(raw_name)
    raw_phone = t_row["phone"].strip()
    raw_hire = t_row["hire_date"]
    raw_job = t_row["job_title"]
    
    # Check Match A: Name Index Collision
    name_match = db_by_name.get(norm_name)
    
    # Check Match B: Phone Index Collision
    phone_match = None
    if raw_phone:
        phone_match = db_by_phone.get(raw_phone)
        
    # Case Matrix Logic:
    
    # SCENARIO 1: Direct Exact Name Match
    if name_match:
        # We matched. Is there any differing data that needs updating?
        # E.g., Phone exists in CSV but not in DB, or different Job Title.
        db_phone = name_match.get("phone", "") or ""
        db_hire = name_match.get("hire_date", "") or ""
        db_job = name_match.get("job_title", "") or ""
        
        needs_patch = False
        update_notes = []
        
        if raw_phone and not db_phone:
            needs_patch = True
            update_notes.append(f"Populate missing phone: {raw_phone}")
        elif raw_phone and db_phone and raw_phone != db_phone:
            needs_patch = True
            update_notes.append(f"Update phone: {db_phone} -> {raw_phone}")
            
        if raw_hire and not db_hire:
            needs_patch = True
            update_notes.append(f"Populate missing hire_date: {raw_hire}")
            
        if raw_job and raw_job != db_job:
            needs_patch = True
            update_notes.append(f"Sync title: {db_job} -> {raw_job}")
            
        if needs_patch:
            row = dict(t_row)
            row["db_id"] = name_match.get("id")
            row["db_internal_code"] = name_match.get("internal_code") or ""
            row["diff_actions"] = "; ".join(update_notes)
            update_candidates.append(row)
            updates_cnt += 1
        else:
            # Exists exactly with same properties, safe to skip.
            skipped_cnt += 1
            
    # SCENARIO 2: No Name Match, but Phone Matches (HIGH RISK FOR DUPLICATION/IDENTITY CONFUSION)
    elif phone_match:
        # The phone is identical but belongs to a DIFFERENT name in DB!
        row = dict(t_row)
        row["conflict_db_name"] = phone_match.get("full_name")
        row["conflict_db_id"] = phone_match.get("id")
        row["conflict_reason"] = "Phone matches existing DB record but FULL NAME is different!"
        duplicate_suspects.append(row)
        review_cnt += 1
        
    # SCENARIO 3: Absolute Net-New Record
    else:
        insert_candidates.append(t_row)
        inserts_cnt += 1

# 7. Dumping Candidate CSV Records
# Write Inserts
with open(os.path.join(PLAN_DIR, "staff_insert_candidates.csv"), "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["full_name", "job_title", "phone", "hire_date", "status"])
    writer.writeheader()
    for r in insert_candidates:
        writer.writerow(r)

# Write Updates
with open(os.path.join(PLAN_DIR, "staff_update_candidates.csv"), "w", encoding="utf-8-sig", newline="") as f:
    fields = ["full_name", "job_title", "phone", "hire_date", "status", "db_id", "db_internal_code", "diff_actions"]
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for r in update_candidates:
        writer.writerow(r)

# Write Duplicates
with open(os.path.join(PLAN_DIR, "staff_possible_duplicates.csv"), "w", encoding="utf-8-sig", newline="") as f:
    fields = ["full_name", "job_title", "phone", "hire_date", "status", "conflict_db_name", "conflict_db_id", "conflict_reason"]
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for r in duplicate_suspects:
        writer.writerow(r)

# 8. Generate Plan Execution Report
print("\n=== ANALYSIS COMPLETED SUCCESSFULLY ===")
print(f"PLANNED ACTION COUNTS:")
print(f" • TOTAL EXTRACTED ROWS: {len(target_rows)}")
print(f" • INSERTS CANDIDATES:   {inserts_cnt}")
print(f" • UPDATES PLANNED:       {updates_cnt}")
print(f" • SAFE TO SKIP:          {skipped_cnt}")
print(f" • REQUIRES MANUAL REVIEW: {review_cnt}")
print(f"Plan outputs archived at: {PLAN_DIR}")

sys.exit(0)
