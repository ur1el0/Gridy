# Task Brief: Extract Citizen Document Request Rows

## 1. Metadata

- **Task ID:** `m12-citizen-request-rows`
- **Task Type:** Frontend refactor
- **Target Component:** Citizen document request table
- **Lead / implementer / reviewer:** Codex (temporary sole-agent mode)
- **Branch:** `refactor/citizen-document-request-rows`

## 2. Objective & Scope

- **Goal:** Move each citizen document request table row into a focused component while preserving the current request state, payment, download, and cancellation behavior.
- **Non-goals:** No API, payment eligibility, business rules, copy, styling, backend, dependency, or production changes; no edits to unrelated files.
- **Context:** After M9 and M10, `CitizenDocuments.tsx` remains 400 lines. Its largest remaining render block is the per-request table row, which combines status, payment details, and user actions.

## 3. Current Behavior & Evidence

- The page maps `requests` into rows with document/purpose/date/status, fee/payment details, payment reference form, PDF download, or pending cancellation action.
- Page-owned handlers implement payment POST, PDF download, and cancellation DELETE/confirmation.
- Existing tests cover payment reference and new request submission; no test currently covers pending-request cancellation.

## 4. Required Architectural Rules

- Keep request loading, API actions, confirmation, state maps, and request eligibility logic in `CitizenDocuments`.
- The row component receives a request, recipients and current controlled form state, pending flags, and action callbacks.
- Preserve all visible labels, status formatting, date formatting, amount formatting, and current conditional rendering.
- Keep `PaymentReferenceForm` and the request modal as separate feature components.

## 5. Observable Acceptance Criteria

1. [x] Each request row is rendered by a focused component under `frontend/src/components/citizen-documents/`.
2. [x] `CitizenDocuments` retains all API and state behavior; the new component contains row presentation only.
3. [x] Payment, new-request, and cancellation integration tests pass with unchanged endpoint/payload behavior.
4. [x] Frontend lint, full test suite, and production build pass.
5. [x] Only M12 task and citizen-document paths are included in the local checkpoint; no push or deployment occurs.

## 6. Relevant Files

- `frontend/src/pages/citizen/CitizenDocuments.tsx`
- `frontend/src/pages/citizen/CitizenDocuments.test.tsx`
- `frontend/src/components/citizen-documents/`
- `docs/ai-workflow/tasks/m12-citizen-request-rows/PLAN.md`
- `docs/ai-workflow/tasks/m12-citizen-request-rows/STATUS.md` (local ignored status log)

## 7. Risks & Mitigations

- **Conditional UI drift:** Preserve the exact eligibility predicates and add a pending cancellation characterization test before moving the JSX.
- **Payment data regression:** Keep the existing payment integration test and request contract unchanged.
