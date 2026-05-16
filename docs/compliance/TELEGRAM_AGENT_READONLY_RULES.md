# Telegram Agent Operational Rules
**Status:** Phase 1 (Read-Only Guardrails)

## 🛡️ Read-Only Enforcement
- The Telegram Agent is strictly **Read-Only** for this phase.
- Any natural language command requesting a "Write" action (Add, Update, Delete, Hire, Onboard) must be intercepted.

## 🚫 Blocked Write Commands
- **English:** `add`, `create`, `update`, `delete`, `assign`, `remove`, `insert`, `hire`, `onboard`, `offboard`, `payroll`, `salary`, `insurance`, `tax`.
- **Arabic:** `ضيف`, `أضف`, `عدل`, `احذف`, `امسح`, `عين`, `انقل`, `صرف`, `مرتب`, `تأمين`, `ضريبة`, `خروج`, `إنهاء`.

## 💬 Mandatory Response
If a write action is requested:
> "هذا الإجراء يحتاج موافقة من لوحة التحكم. أقدر أعرض البيانات قراءة فقط الآن."
