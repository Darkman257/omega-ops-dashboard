# Omega Operations Compliance Rules (Phase 1)
**Region:** Egypt

## 1. Manual Staff Entry
- Fields required for compliance: `full_name`, `phone`, `job_title`, `hire_date`, `current_site`, `employment_status`, `insurance_status`, `contract_status`.
- Mandatory secondary check for Social Insurance (التأمينات الاجتماعية) status.

## 2. Payroll & Taxes
- All write actions on salary/tax fields are currently **Blocked** or require **Critical Approval**.
- Calculations provided by the system are "Drafts" and subject to manual audit.

## 3. Offboarding & Clearance
- Staff cannot be set to "Terminated" without an uploaded "Clearance Form" reference.
- Offboarding workflow must include labor law compliance checks (notice period, etc.).

## 4. Database Safety
- `DELETE` operations on operational tables are forbidden.
- Audit logs should track all status changes for Staff and Assets.
