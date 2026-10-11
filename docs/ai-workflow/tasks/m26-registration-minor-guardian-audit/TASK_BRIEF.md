# Task Brief: Minor Registration Guardian Control Audit

## 1. Metadata
- **Task ID:** `m26-registration-minor-guardian-audit`
- **Task Type:** Read-only accessibility and conditional-state audit
- **Target:** Resident registration's under-18 guardian notice and username field
- **Lead / Reviewer:** Codex (user-directed sole-agent mode)
- **Branch / Base:** `audit/registration-minor-guardian-fields` / M25 checkpoint `8d3e1da`

## 2. Objective and Scope
- **Goal:** Verify the under-18 registration path renders an understandable guardian notice and a correctly named, required guardian username field, then hides it for an applicant who has reached age 18.
- **Evidence:** M20 did not runtime-render minor-only controls; source shows `isMinor` conditionally renders a required `TextField`.
- **Non-goals:** No source/style/configuration changes, real personal data, file selection, account creation, API mutation, or production interaction.

## 3. Observable Acceptance Criteria
1. [x] A synthetic date one day before the 18th birthday renders the guardian notice and username control.
2. [x] The guardian input has a visible associated label, textbox role/name in Chrome AX, `required=true`, and an empty-value required state.
3. [x] A synthetic date on the 18th birthday hides the guardian notice and field; the previous underage state can be restored by changing the synthetic date back.
4. [x] At 320 CSS pixels, the guardian notice and input remain within the viewport without horizontal document overflow.
5. [x] Only the synthetic date field is populated; no files, other values, form submissions, or non-GET requests occur.
6. [x] Audit results and limits are recorded; only M26 brief/plan/report are checkpointed.

## 4. Constraints
- Follow `docs/ai-workflow/playbooks/AUDIT.md`; remain read-only toward application source, configuration, and persistent data.
- Use only local Vite and isolated headless Chrome. Use dates `2008-10-11` (age 17 on 2026-10-10) and `2008-10-10` (18th birthday) to check the boundary.
- Synthetic browser form state is temporary and must not be submitted; document that this is not a real resident record.
- Preserve unrelated untracked `.agents/`, `.codex/`, logo assets, and task/environment files.
