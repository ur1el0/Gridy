# Implementation Plan: Citizen Document Request Row Extraction

> **Work contract:** Presentation-only React extraction. Keep all fetches, state, business eligibility, API actions, and error handling in `CitizenDocuments`. Characterize pending cancellation before moving the row. Verify, record results, review, then create a scoped local checkpoint. Do not push or deploy.

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Task ID:** `m12-citizen-request-rows`
- **Target Branch:** `refactor/citizen-document-request-rows`
- **Complexity:** Medium

## 2. Milestone 1: Characterize Cancellation

- **Objective:** Add a page-level pending-request cancellation test before extracting the row.
- **Files to modify:** `frontend/src/pages/citizen/CitizenDocuments.test.tsx`.
- **Detailed actions:** Mock a pending request, confirm the browser prompt, click the accessible cancel button, and assert `DELETE /document-requests/{id}/`.
- **Validation:**
  ```bash
  npm --prefix frontend run test -- src/pages/citizen/CitizenDocuments.test.tsx
  ```
- **Expected outcome:** The existing payment/request tests and the new cancellation characterization pass against the current implementation.

## 3. Milestone 2: Extract Request Row Presentation

- **Objective:** Reduce nested table JSX while keeping the page as the workflow owner.
- **Files to modify:**
  - `frontend/src/pages/citizen/CitizenDocuments.tsx`
  - `frontend/src/pages/citizen/CitizenDocuments.test.tsx`
  - `frontend/src/components/citizen-documents/types.ts`
  - Add `frontend/src/components/citizen-documents/DocumentRequestRow.tsx`.
- **Detailed actions:**
  1. Move the request and payment/status/action cells plus status badge rendering into `DocumentRequestRow`.
  2. Pass request/recipient data, controlled state values, pending flags, and callbacks from the page.
  3. Keep cancellation confirmation and API operations, PDF handling, payment validation/POST, and page state unchanged.
  4. Run targeted and full frontend verification.
- **Validation commands:**
  ```bash
  npm --prefix frontend run test -- src/pages/citizen/CitizenDocuments.test.tsx
  npm --prefix frontend run test
  npm --prefix frontend run lint
  npm --prefix frontend run build
  git diff --check
  ```
- **Expected outcome:** Existing and new interaction tests pass; all current frontend checks remain green.

## 4. Risks & Rollback

- Prop wiring errors could affect row action behavior; targeted page tests guard payment, creation, and cancellation paths.
- Revert the M12 checkpoint to restore the inline rows; no backend or database effects occur.

## 5. Completion Gate

- [x] Row JSX and status badge are extracted without moving workflow state.
- [x] Payment, request creation, and cancellation tests pass.
- [x] Lint, full frontend suite, and production build pass.
- [x] Only M12 scoped paths are staged and committed.
