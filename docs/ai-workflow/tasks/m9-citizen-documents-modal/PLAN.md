# Implementation Plan: Citizen Clearance Request Modal Extraction

> **Work contract:** Presentation-only React refactor. Keep state, validation, API calls, and request workflow in the page; preserve modal content and behavior. Verify, record actual results, review the scoped diff, and create a local checkpoint. Do not push or deploy.

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Task ID:** `m9-citizen-documents-modal`
- **Target Branch:** `refactor/citizen-documents-components`
- **Complexity:** Low

## 2. Milestone 1: Extract Modal Presentation

- **Objective:** Move the inline new-clearance modal to a reusable, controlled component without moving its page-owned workflow state.
- **Files to modify:**
  - `frontend/src/pages/citizen/CitizenDocuments.tsx`
  - `frontend/src/pages/citizen/CitizenDocuments.test.tsx`
  - Add `frontend/src/components/citizen-documents/NewDocumentRequestModal.tsx`.
  - Add `frontend/src/components/citizen-documents/documentTypes.ts` for the shared choices.
- **Detailed actions:**
  1. Run the existing page test as the baseline.
  2. Move modal markup and the `DOCUMENT_TYPES` choices into the component, retaining labels, copy, classes, and semantic elements.
  3. Pass document type, purpose, submitting state, and page callbacks as props; keep `handleCreateRequest()` and all its side effects in `CitizenDocuments`.
  4. Add an integration test for opening and successfully submitting a request; assert the current POST URL and body.
  5. Run page tests, full frontend tests, lint, build, and diff checks.
- **Validation commands:**
  ```bash
  npm --prefix frontend run test -- src/pages/citizen/CitizenDocuments.test.tsx
  npm --prefix frontend run lint
  npm --prefix frontend run test
  npm --prefix frontend run build
  git diff --check
  ```
- **Expected outcome:** The new modal component is controlled by existing page state; the page-level API contract and payment test pass; all frontend checks pass.

## 3. Risks & Rollback

- The form callback type may need an explicit React event type; preserve the existing handler contract and verify with TypeScript build.
- Revert the local M9 checkpoint to restore the inline modal if an issue appears; no server or database state is affected.

## 4. Completion Gate

- [x] Modal is extracted with page-owned state and submission logic.
- [x] Request creation and existing payment-reference integration tests pass.
- [x] Lint, full frontend suite, and production build pass.
- [x] Only M9 task and frontend paths are staged and committed.
