import os
import csv
import re

# Define Artifact Base Directory
OUTPUT_DIR = "/mnt/d/NEXUS/PROJECTS/omega-ops-dashboard/artifacts/staff-data-audit/image-extraction"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -----------------------------------------------------------------
# 1. RAW DATA FROM IMAGE 1 (Sanitized Dashboard Export)
# -----------------------------------------------------------------
IMAGE_1_ROWS = [
    (1, "REDACTED_EMPLOYEE_A", "REDACTED_JOB_TITLE", "REDACTED_DATE"),
    (2, "REDACTED_EMPLOYEE_B", "REDACTED_JOB_TITLE", "REDACTED_DATE"),
]

# -----------------------------------------------------------------
# 2. RAW DATA FROM IMAGE 2 (Sanitized Physical Phone Registry)
# -----------------------------------------------------------------
IMAGE_2_ROWS = [
    (1, "REDACTED_PHONE_A", "REDACTED_JOB_TITLE", "REDACTED_EMPLOYEE_A"),
    (2, "REDACTED_PHONE_B", "REDACTED_JOB_TITLE", "REDACTED_EMPLOYEE_B"),
]

# -----------------------------------------------------------------
# Helper functions (Unicode Encoded to prevent literal Arabic)
# -----------------------------------------------------------------
def normalize_arabic(text):
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r'\s+', ' ', t)
    
    # Normalizations using Unicode Escapes for absolute security:
    # Replace instances of Alef-Hamzas with generic Alef
    t = t.replace('\u0625', '\u0627').replace('\u0623', '\u0627').replace('\u0622', '\u0627')
    # Replace Alef-Maksura with Yaa
    t = t.replace('\u0649', '\u064a')
    # Replace Taa-Marbuta with Haa
    t = t.replace('\u0629', '\u0647')
    # Split concatenated prefix names
    t = t.replace('\u0645\u062d\u0645\u062f\u0639\u0628\u062f', '\u0645\u062d\u0645\u062f \u0639\u0628\u062f')
    return t

def format_phone(raw_num):
    if not raw_num:
        return ""
    cleaned = str(raw_num).strip()
    if len(cleaned) == 10 and cleaned.startswith("1"):
        return "0" + cleaned
    return cleaned

# Create Phone Lookup Matrix
phone_map = {}
for entry in IMAGE_2_ROWS:
    normalized_name = normalize_arabic(entry[3])
    phone_map[normalized_name] = {
        "phone": format_phone(entry[1]),
        "raw_name": entry[3],
        "raw_id": entry[0],
        "title": entry[2]
    }

# -----------------------------------------------------------------
# DATA CONSOLIDATION
# -----------------------------------------------------------------
all_rows = []
review_rows = []
matched_count = 0

for row1 in IMAGE_1_ROWS:
    raw_id, full_name, job_title, hire_date = row1
    normalized_1 = normalize_arabic(full_name)
    
    phone = ""
    status = "active"
    notes = ""
    needs_review = "no"
    
    match_data = phone_map.get(normalized_1)
    
    # Explicit logic for redacted example
    if not match_data and "REDACTED_EMPLOYEE" in normalized_1:
        for k, v in phone_map.items():
            if "REDACTED_EMPLOYEE" in k:
                match_data = v
                needs_review = "yes"
                notes = f"Discrepancy in father/grandfather name: Image1='{full_name}' vs Image2='{v['raw_name']}'"
                break
                
    if match_data:
        phone = match_data["phone"]
        matched_count += 1
        if needs_review == "no":
             notes = "Matched successfully."
    else:
        notes = "Phone record missing from physical sheet."
        
    consolidated = {
        "full_name": full_name.strip(),
        "job_title": job_title.strip(),
        "phone": phone,
        "hire_date": hire_date,
        "status": status,
        "needs_review": needs_review,
        "audit_notes": notes
    }
    
    all_rows.append(consolidated)
    if needs_review == "yes":
        review_rows.append(consolidated)

# -----------------------------------------------------------------
# FILE GENERATION
# -----------------------------------------------------------------
with open(os.path.join(OUTPUT_DIR, "extracted_staff_raw.csv"), "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["id", "full_name", "job_title", "hire_date"])
    for r in IMAGE_1_ROWS:
        writer.writerow(r)

with open(os.path.join(OUTPUT_DIR, "extracted_staff_merged.csv"), "w", encoding="utf-8-sig", newline="") as f:
    fields = ["full_name", "job_title", "phone", "hire_date", "status"]
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for row in all_rows:
        writer.writerow({k: row[k] for k in fields})

with open(os.path.join(OUTPUT_DIR, "extracted_staff_review_needed.csv"), "w", encoding="utf-8-sig", newline="") as f:
    fields = ["full_name", "job_title", "phone", "hire_date", "needs_review", "audit_notes"]
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for row in review_rows:
        writer.writerow({k: row[k] for k in fields})

# Generate Report String Sanitized
audit_content = f"""# OMEGA STAFF DATA EXTRACTION & MERGE AUDIT

## Summary Analytics
- **Total Personnel in Registry (Image 1)**: {len(IMAGE_1_ROWS)}
- **Total Phone Records Isolated (Image 2)**: {len(IMAGE_2_ROWS)}
- **Successfully Synced Merges**: {matched_count}
- **Low-Confidence Flags**: {len(review_rows)}

## Data Standardization Applied
1. **Arabic Character Fold-Folding**: Programmatically normalized instances of alef hamzas to generic alef and resolved terminal variations.
2. **Inter-Space Corrections**: Rebuilt concatenated occurrences automatically.
3. **Egyptian Mobile Prefixes**: Detected 10-digit strings and padded them with leading 0s.

## Review Alerts Isolated
| Target Name | Discrepancy Detail | Action |
| :--- | :--- | :--- |
| REDACTED_EMPLOYEE | Assigned Phone `REDACTED_PHONE` derived from Record `REDACTED_EMPLOYEE`. Discrepancy detected. | Awaiting confirmation. |

*Audit complete. Datasets preserved safely.*
"""

with open(os.path.join(OUTPUT_DIR, "EXTRACTION_AUDIT.md"), "w", encoding="utf-8") as f:
    f.write(audit_content)

print("COLLATOR STATUS: SUCCESS")
print(f"All artifacts dumped cleanly to: {OUTPUT_DIR}")
