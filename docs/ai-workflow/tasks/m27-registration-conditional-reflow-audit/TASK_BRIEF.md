# Task Brief: Registration Conditional-State Reflow Audit

## 1. Metadata

- **Task ID:** `m27-registration-conditional-reflow-audit`
- **Task Type:** Read-only accessibility and responsive-layout audit
- **Target:** KapitBayan resident registration's conditional verification, guardian, and official-registration states
- **Branch / Base:** `audit/registration-conditional-reflow-states` / `d6bf737`
- **Lead / Reviewer:** Codex, user-directed sole-agent mode

## 2. Objective and Scope

- **Goal:** Determine whether the registration form's conditional content reflows without horizontal overflow or clipped controls at 320 CSS pixels.
- **States:** Resident default; expanded identity/residency verification; under-18 guardian state; combined expanded-verification plus guardian state; official registration mode.
- **Non-goals:** Source/style/configuration changes, real personal data, file selection, account creation, API mutation, or production interaction.
- **Context:** M25 checked the default resident state at narrow widths, and M26 checked the guardian state. This audit covers the remaining conditional content and their combined layout.

## 3. Current Behavior and Evidence

- `frontend/src/pages/auth/Register.tsx` conditionally renders the verification disclosure for residents, guardian notice for under-18 residents, and `AdminCredentialsSection` for officials.
- `frontend/src/components/auth/register/ResidentVerificationUploads.tsx` expands three identity/residency proof sections.
- `frontend/src/components/auth/register/AdminCredentialsSection.tsx` renders the official passkey and affirmation controls.
- Existing M25 and M26 audit reports are linked in the task history; this task records a focused recheck rather than a full WCAG claim.

## 4. Required Rules

- Follow `docs/ai-workflow/playbooks/AUDIT.md`; keep application source, configuration, and persistent data read-only.
- Use only local Vite and an isolated local browser session.
- Use the synthetic birth date `2008-10-11` to expose the under-18 state on the audit date, 2026-10-10.
- Toggle the disclosure and registration mode through the UI. Do not submit the form, enter other values, select files, or initiate non-GET requests.
- Preserve unrelated untracked environment files and directories.

## 5. Observable Acceptance Criteria

1. [ ] Each scoped conditional state is rendered at 320 CSS pixels; the 375-pixel width is recorded as supplemental evidence.
2. [ ] Record viewport/document widths, horizontal overflow, and horizontal bounds for visible focusable controls and conditional content.
3. [ ] Visually inspect temporary screenshots for the expanded verification, combined minor, and official states; screenshots stay outside the repository.
4. [ ] Record the mode and disclosure accessible names/state, guardian textbox label/required state, and official passkey/affirmation names.
5. [ ] Confirm browser/runtime health and that only safe local GET requests occurred; no form submission or file selection occurred.
6. [ ] Save the audit report and ignored `STATUS.md`; make no application-source changes and checkpoint only M27 task documentation.

## 6. Relevant Files

- `frontend/src/pages/auth/Register.tsx`
- `frontend/src/components/auth/register/ResidentVerificationUploads.tsx`
- `frontend/src/components/auth/register/AdminCredentialsSection.tsx`
- `docs/ai-workflow/tasks/m25-registration-reflow-audit/AUDIT.md`
- `docs/ai-workflow/tasks/m26-registration-minor-guardian-audit/AUDIT.md`

## 7. Risks and Limits

- Local viewport emulation checks CSS reflow but does not exercise browser zoom controls, physical devices, or assistive-technology speech.
- Public barangay directory data may be fetched by the registration page; record actual request methods and outcomes.
- Do not claim full WCAG conformance from this focused audit.
