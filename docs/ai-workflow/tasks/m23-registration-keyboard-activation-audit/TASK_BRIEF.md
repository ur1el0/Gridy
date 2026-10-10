# Task Brief: Registration Control Keyboard Activation Audit

## 1. Metadata
- **Task ID:** `m23-registration-keyboard-activation-audit`
- **Task Type:** Read-only accessibility audit
- **Target:** Web registration mode switch and resident verification disclosure
- **Lead / Reviewer:** Codex (user-directed sole-agent mode)
- **Branch / Base:** `audit/registration-keyboard-activation` / M22 checkpoint `44633f4`

## 2. Objective and Scope
- **Goal:** Empirically verify keyboard focus and Enter/Space activation of all registration mode-switch and verification-disclosure buttons left unverified in M20.
- **Context:** M20 recorded that Tab traversal reached controls, but synthetic CDP Enter events did not confirm activation. M21 and M22 since addressed the official affirmation required state and the disclosure's `aria-expanded` state.
- **Non-goals:** No application changes, form entry, file selection, registration submission, API mutation, automated accessibility dependency, full WCAG audit, or screen-reader/device certification.

## 3. Current Behavior and Evidence
- `docs/ai-workflow/tasks/m20-registration-form-accessibility-sweep/AUDIT.md` records keyboard activation as unverified.
- `RegisterHeroBanner.tsx` renders a native `button` for resident/official mode changes, and `Register.tsx` renders a second mode-switch button below the form.
- `ResidentVerificationUploads.tsx` renders a native disclosure `button` exposing `aria-expanded`.

## 4. Observable Acceptance Criteria
1. [x] Local `/register` loads in isolated Chrome and all three controls appear with their expected button role and accessible name.
2. [x] Real CDP Tab key events focus each target control; active element and visible focus treatment are recorded.
3. [x] Enter and Space key events activate both mode-switch buttons and the disclosure; the resulting state is recorded.
4. [x] Record browser console/runtime/network results and confirm no fields, files, or registration submissions were changed.
5. [x] Audit report and ignored `STATUS.md` record actual methods/results; only M23 documentation is checkpointed.

## 5. Constraints
- Follow `docs/ai-workflow/playbooks/AUDIT.md`; remain read-only toward application source, configuration, and data.
- Use only local Vite and an isolated headless Chrome session.
- If keyboard activation cannot be verified or a defect is observed, report the concrete evidence and propose a separate implementation task; do not modify the app during this audit.
- Preserve unrelated untracked `.agents/`, `.codex/`, logo assets, and task/environment files.
