# SALLY RECRUITMENT COMMAND CENTER - SEPARATION BLUEPRINT

## 1. Current Omega Recruitment Implementation Audit
**Audit Result:** A full repository scan confirms that no `applicants` or `recruitment_media_assets` usage exists in the current Omega frontend or API layer. There are no dedicated Recruitment pages, components, or API routes in `omega-dashboard`. 
**Conclusion:** The Omega codebase is currently clean of Recruitment logic. The separation is purely conceptual at this point, which is ideal as it prevents the need for complex code entanglement extraction. All candidate dossier logic, WhatsApp message logic, and CV import scripts remain unbuilt in the Omega repo and will be built fresh in the new standalone app.

## 2. Current Omega Recruitment Routes
- **Route Path:** None exist.
- **Sidebar Entry:** None exist.
- **Lazy Loading:** None exist.
- **Page Mapping:** None exist.

## 3. Current Data Flow
- **Tables Used:** None currently queried in Omega.
- **applicants usage:** Not present in Omega.
- **recruitment_media_assets usage:** Not present in Omega.
- **AI / Status Logic:** Not present in Omega.
- **Supabase Query Patterns:** No existing recruitment queries to migrate.

## 4. What Can Be Reused Conceptually
Although no specific recruitment code exists, the following Omega patterns should be reused conceptually (do not copy blindly):
- **UI Identity:** Dark NEXUS UI, glass panels, cyberpunk premium feel, neon accents for status indicators.
- **Component Patterns:** Reusable UI components (e.g., DataTables, Tabs, Dialogs, generic Forms).
- **Supabase Client Pattern:** Use the structured `@supabase/supabase-js` client initialization and provider patterns.
- **Candidate Profile/Dossier Pattern:** The layout pattern from `Staff.tsx` / `Profile.tsx` can be adapted for the Candidate Profile.
- **WhatsApp Prepared Message Pattern:** Conceptual implementation of pre-filled `wa.me` links.
- **Print Summary Pattern:** Replicate standard layout structures that print cleanly.
- **Status Flow Pattern:** Similar to how `Approvals.tsx` handles status transitions with badges and confirmation modals.

## 5. What Must NOT Be Copied
The following Omega modules and configs MUST NOT be brought into the Sally Recruitment app:
- Staff module
- Fleet/Vehicles module
- Housing module
- Payroll module
- Approvals module
- Site Admin Tasks
- Employee Clearance
- Omega-specific dashboards
- Omega Supabase keys (use separate `sally-recruitment-db` keys)
- Omega private files
- CV/PDF/DOCX/image files
- `.env` files (start fresh)

## 6. Target Sally App Structure
Proposed clean structure for the standalone `sally-recruitment-command-center`:

```text
sally-recruitment-command-center/
  src/
    app/
      App.tsx
      Router.tsx
    features/
      recruitment/
        pages/
          RecruitmentDashboard.tsx
          Candidates.tsx
          CandidateProfile.tsx
          Interviews.tsx
          Offers.tsx
          Analytics.tsx
        components/
          CandidateCard.tsx
          CandidateForm.tsx
          CandidateDossier.tsx
          InterviewBoard.tsx
          OfferTracker.tsx
        api/
          recruitmentApi.ts
        types/
          recruitment.types.ts
    components/
      layout/
      ui/
      nexus/
    lib/
      supabase.ts
      utils.ts
    styles/
  supabase/
    migrations/
      001_recruitment_core.sql
  docs/
    PROJECT_RULES.md
    SALLY_WORKFLOW.md
    CHANGE_REQUEST_TEMPLATE.md
  .env.example
  package.json
  README.md
```

## 7. Target MVP Features
- **Dashboard KPIs:** Active applicants, interviews this week, pending offers.
- **Candidates List:** Table with filtering by status and role.
- **Add/Edit Candidate:** Manual data entry form.
- **Candidate Profile/Dossier:** Detailed view with notes, resume link, and history.
- **Interview Pipeline:** Kanban board or list view of scheduled interviews.
- **Offer Tracking:** Track sent, accepted, rejected offers.
- **Recruitment Analytics:** High-level overview of hiring speed and pipeline health.
- **Settings:** Configure job titles and recruitment sources.
- **Print/PDF-ready Candidate Summary:** Exportable dossier layout.
- **WhatsApp Message-ready Action:** Click to copy/open WhatsApp with a pre-formatted message.

## 8. Target Database Design Draft
*Draft Only - Do Not Apply*

**Required Tables:**
- `applicants`
- `candidate_notes`
- `interviews`
- `job_openings`
- `offers`
- `recruitment_activity_log`

**Required Statuses:**
- `new`
- `needs_review`
- `shortlisted`
- `interview_scheduled`
- `interviewed`
- `offer_sent`
- `accepted`
- `rejected`
- `on_hold`

## VERDENT BUILD BRIEF

- **Objective:** Build a standalone recruitment command center for Sally (HR Owner) to manage the candidate pipeline manually.
- **Repo Name:** `sally-recruitment-command-center`
- **Stack:** React, Vite, TypeScript strict, Tailwind CSS, separate Supabase Cloud project (`sally-recruitment-db`). No n8n or automation in MVP. Dark NEXUS UI.
- **Rules:** Do not mix operations logic. Do not copy Omega config. All data entry is manual first.
- **Required Pages:** Dashboard, Candidates, Candidate Profile, Interviews, Offers, Analytics.
- **Required Tables:** `applicants`, `candidate_notes`, `interviews`, `job_openings`, `offers`, `recruitment_activity_log`.
- **Required Status Flow:** `new` -> `needs_review` -> `shortlisted` -> `interview_scheduled` -> `interviewed` -> `offer_sent` -> `accepted`/`rejected`/`on_hold`.
- **Do-Not-Copy Rules:** No Staff, Fleet, Housing, Payroll, Approvals, Site Admin Tasks, or Employee Clearance logic. Do not copy Omega `.env` or keys.
- **Acceptance Criteria:** Must be a standalone app. Must connect to a separate Supabase instance. Must implement all MVP features with manual data entry.
- **Final Report Format:** Standard build report outlining pages created, DB schema applied, and how to start the app.

## ANTIGRAVITY MAC RUN BRIEF

- **Open local repo path:** `~/NEXUS/sally-recruitment-command-center`
- **Install dependencies:** `pnpm install` or `npm install`
- **Inspect structure:** Verify alignment with the target app structure.
- **Inspect `.env.example`:** Ensure no real keys are present.
- **Create `.env.local` manually later:** Do not commit this file.
- **Run build:** `npm run build` or `pnpm run build`
- **Run dev:** `npm run dev` or `pnpm run dev`
- **Verify Supabase connection:** Ensure it targets `sally-recruitment-db`.
- **Safety rules:** Do not commit CVs. Do not commit `.env`. Fix only blocking errors.

## SALLY CHATGPT OPERATING PROMPT

**Prompt Template for Sally:**
> "You are an expert HR Assistant for the NEXUS Sally Recruitment Command Center. I need your help with managing the recruitment pipeline. Please provide output based on the following task:
> [ ] Screen Candidate: Here is a candidate's profile/CV. Tell me if they match the requirements for [Job Title].
> [ ] Write Interview Questions: Provide 5 technical and 3 behavioral questions for a [Job Title] role.
> [ ] Prepare WhatsApp Message: Draft a professional WhatsApp message to invite [Candidate Name] for an interview on [Date/Time].
> [ ] Classify Status: Based on these interview notes, should this candidate be moved to 'shortlisted', 'offer_sent', or 'rejected'?
> [ ] Prepare Developer Change Request: Help me draft a feature request using the CHANGE REQUEST template.
> [ ] Produce Daily Update: Here is my raw data for today. Format it into the SALLY DAILY UPDATE template.
> 
> Task context: [Insert Context Here]"

## CHANGE REQUEST TEMPLATE

```text
[CHANGE REQUEST]

App: Sally Recruitment Command Center
Screen: 
Problem: 
Expected Result: 
Priority: (Low/Medium/High/Critical)
Data Impact: 
Screenshot: (Attach if applicable)
```

## SALLY DAILY UPDATE TEMPLATE

```text
[SALLY DAILY UPDATE]

Date: 
Total Candidates Added: 
Interviews Scheduled: 
Offers Sent: 
Blocked Items: 
Dashboard Issues: 
Needed Changes: 
```
