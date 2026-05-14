# OMEGA OPERATIONS — STAFF IMPORT EXECUTION PLAN (PROPOSAL)

> [!IMPORTANT]
> **STATUS: DRY-RUN AUDIT COMPLETED.** No write operations have been executed against the Supabase database. This plan serves as the mandatory pre-ingest safety checklist awaiting operational authorization.

---

## 1. Registry Audit Analytics
A comparative analysis was executed, querying the live PostgREST API (`staff` table) against our normalized `extracted_staff_merged.csv`. 

### **Baseline Demographics**
*   **Existing Registered Density (Supabase)**: **83 Records**
*   **Candidate Payload Density (Image Source)**: **55 Records**

### **Planned Operational Counts**
| Metric Indicator | Count | Action Strategy |
| :--- | :---: | :--- |
| **Inserts Planned** | **42** | Net-new accounts currently absent from registry. |
| **Updates Planned** | **13** | Existent entities needing enrichment (Phone, Job Title, or Hire Date). |
| **Skipped (Exact Matches)** | **0** | Every candidate record introduces rich structural additions. |
| **Requires Manual Review** | **0** | Zero identity collisions or duplicate phone assignments detected! |

---

## 2. Safe Upsert Strategy Matrix
Per system guidelines, we outline the comparative precedence for matching records to avoid duplication of personnel entities.

### **Precedence Model**
1.  **Primary Target Index (`internal_code`)**: 
    *Check if incoming record specifies a 4-digit operational identifier.*
    *   *Audit Status*: The OCR candidate source does **not** contain internal codes. Therefore, this route is **skipped** for matching, but will be used for generating next-in-sequence identifiers for net-new inserts.
2.  **Secondary Target Index (`normalized full_name`)**:
    *Apply Arabic Character Folding normalization to the input string and compare with DB registries.*
    *   *Audit Status*: **ACTIVE SELECTOR**. 13 entities matched flawlessly under this deterministic check.

---

## 3. Operational Transaction Phasing (Proposed)
To ensure 100% data integrity and ACID adherence, the ingest will execute in two distinct isolated steps:

### **Phase A: Atomic Update Patching (13 Rows)**
*   **Target Target Matrix**: `staff_update_candidates.csv`
*   **Execution Protocol**: Execute targeted `PATCH` requests directly addressing unique database primary keys (`id=X`).
*   **Safety Gate**: Zero dependency on string matching at runtime. Only specific vacant or outdated attributes (`phone`, `hire_date`, `job_title`) are modified.

### **Phase B: Incremental Roster Extension (42 Rows)**
*   **Target Target Matrix**: `staff_insert_candidates.csv`
*   **Execution Protocol**: Query maximum current `internal_code` in Supabase (e.g. `1083`), assign sequential integers (e.g. `1084`, `1085`, ...) to the 42 insert candidates, and execute a single transactional bulk `POST` payload.
*   **Safety Gate**: Guarantees proper schema indexing and serial identifier allocation.

---

## 4. Candidate File Manifests
Generated plan datasets are preserved in the audit block:
- 📂 **Plan Location**: `D:\NEXUS\PROJECTS\omega-ops-dashboard\artifacts\staff-data-audit\import-plan\`
- 📄 **[staff_insert_candidates.csv](file:///D:/NEXUS/PROJECTS/omega-ops-dashboard/artifacts/staff-data-audit/import-plan/staff_insert_candidates.csv)**
- 📄 **[staff_update_candidates.csv](file:///D:/NEXUS/PROJECTS/omega-ops-dashboard/artifacts/staff-data-audit/import-plan/staff_update_candidates.csv)**
- 📄 **[staff_possible_duplicates.csv](file:///D:/NEXUS/PROJECTS/omega-ops-dashboard/artifacts/staff-data-audit/import-plan/staff_possible_duplicates.csv)** *(Zero-byte clean)*

---

> [!CAUTION]
> **STANDING BY FOR EXPLICIT AUTHORIZATION.** Ready to build the execution ingestion script upon receiving approval token.
