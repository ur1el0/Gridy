# Task Brief: M59 — Resident Directory Load Error States

## 1. Metadata

- **Task ID:** `m59-resident-directory-load-error-states`
- **Task Type:** Bug Fix
- **Target Components:** Frontend resident directory and verification queue
- **Implementer / Reviewer:** Codex (user-directed sole-agent mode)
- **Branch:** `fix/m59-resident-load-error-states`
- **Base:** M58 checkpoint `752467f8213ea9b0c253b63f7e8512b0d7edee3d`

## 2. Objective & Scope

- **Goal:** Make failed resident directory and pending-verification fetches visibly distinct from valid empty results and provide an accessible retry action.
- **Non-goals:** Do not change API endpoints or payloads, resident ownership, barangay scoping, permissions, authentication, mutations, schema, dependencies, shared fetch architecture, other screens, or Azure resources.
- **Problem:** Both screens log initial list-fetch failures, clear their loading state, and then render empty-list content. Staff can mistake a network/API failure for a genuinely empty directory or verification queue.

## 3. Current Behavior & Evidence

- `frontend/src/pages/community/ResidentsManagement.tsx:29-38` catches a directory fetch error only with `console.error`, then clears `loading`. The page passes an empty list to `ResidentDirectoryTable`, which renders “No verified residents found.” (`frontend/src/components/residents/ResidentDirectoryTable.tsx:37-42`).
- `frontend/src/pages/community/ResidentVerification.tsx:39-51` likewise logs a pending-resident fetch failure and clears `loading`; it then renders a count of zero and `VerificationTable`'s “No pending verifications match your filters.” empty state.
- Existing shared `InlineErrorState` at `frontend/src/components/ui/InlineErrorState.tsx` provides a screen-reader announced error (`role="alert"`) and keyboard-operable retry button. M57 uses this component to distinguish load failures from successful empty responses.
- Existing page tests cover successful loads and actions, but neither page tests failed initial loads or retry behavior.

## 4. Required Business & Architectural Rules

- **Barangay Multi-Tenancy:** No query or tenant behavior changes. Existing server-side scoping remains authoritative.
- **RBAC:** No permission or role changes; these staff pages keep their existing route/API protections.
- **Session & Token Security:** No authentication changes.
- **Treasury & Audit Rules:** No payment, receipt, or audit behavior changes.
- **Background Tasks:** No background task changes; do not add Celery or Redis.
- A failed request must not be represented as an empty successful response. Keep the existing empty states for successful empty payloads.
- Error UI must not expose exception details and must preserve existing page controls and successful data behavior.

## 5. Observable Acceptance Criteria

1. [ ] **AC-1:** A failed resident-directory load displays an accessible error and retry action instead of “No verified residents found.”
2. [ ] **AC-2:** Retrying the directory calls the same endpoint; successful data clears the error and renders residents, while a successful empty response retains the current empty state.
3. [ ] **AC-3:** A failed pending-verification load displays an accessible error and retry action instead of a zero-result count/table empty state.
4. [ ] **AC-4:** Retrying verification calls the same endpoint; successful data clears the error and renders the existing queue, while a successful empty response retains the current empty state.
5. [ ] **AC-5:** The retry control is disabled while its request is pending and does not trigger approval, rejection, import, or other mutation handlers.
6. [ ] **AC-6:** Existing populated-list behavior and staff actions remain unchanged; no API, schema, dependency, tenant, RBAC, or Azure changes are introduced.
7. [ ] **AC-7:** Focused tests, frontend lint, full frontend tests, production build, and diff hygiene pass and actual results are recorded in `STATUS.md`.

## 6. Relevant Files & Affected Areas

- `frontend/src/pages/community/ResidentsManagement.tsx`
- `frontend/src/pages/community/ResidentsManagement.test.tsx`
- `frontend/src/pages/community/ResidentVerification.tsx`
- `frontend/src/pages/community/ResidentVerification.test.tsx`
- `frontend/src/components/ui/InlineErrorState.tsx` (reuse only; no modification expected)

## 7. Constraints & Known Risks

- Work only in `/tmp/gridy-m59-resident-load-error-states`; do not modify the primary checkout or its untracked `.agents/`, `.codex/`, `.aws/`, or supplied logo files.
- This is stacked on M58 PR #189; target the M58 branch as the PR base and leave the PR open and unmerged. Azure pilot remains NO-GO.
- Keep the successful empty response distinct from failure and avoid displaying a misleading pending count when verification data failed to load.
- Use only mocked frontend test data. Do not contact production APIs or modify data.
