# Implementation Plan: Citizen Document Payment Form Extraction

> **Work contract:** Presentation-only React refactor. Keep payment state, eligibility, validation, and API workflow in the page. Preserve the rendered form and verify its existing contract before making a local scoped checkpoint. Do not push or deploy.

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Task ID:** `m10-citizen-payment-form`
- **Target Branch:** `refactor/citizen-document-payment-form`
- **Complexity:** Low

## 2. Milestone 1: Extract the Payment Reference Form

- **Objective:** Move the nested payment reference UI to a child component while preserving its controlled state and parent-owned submit handler.
- **Files to modify:**
  - `frontend/src/pages/citizen/CitizenDocuments.tsx`
  - `frontend/src/pages/citizen/CitizenDocuments.test.tsx` (inspect; update only if imports need adjustment)
  - Add `frontend/src/components/citizen-documents/PaymentReferenceForm.tsx`.
  - Add a shared types file if the payment recipient contract must be used by both modules.
- **Detailed actions:**
  1. Run the current page test as baseline.
  2. Move the inline form, recipient detail, and empty-recipient message into the child component.
  3. Pass recipient list, current recipient/reference values, pending state, value callbacks, and submit callback as props.
  4. Leave form visibility condition, state, API request, response merge, and toasts in the page.
  5. Run targeted and full frontend verification.
- **Validation commands:**
  ```bash
  npm --prefix frontend run test -- src/pages/citizen/CitizenDocuments.test.tsx
  npm --prefix frontend run lint
  npm --prefix frontend run test
  npm --prefix frontend run build
  git diff --check
  ```
- **Expected outcome:** Existing payment reference test passes unchanged, child component only handles presentation, and all frontend checks pass.

## 3. Risks & Rollback

- Incorrect prop wiring could alter the payment request body or form controls; the integration assertion guards the request contract.
- Revert the local M10 checkpoint to restore the inline form; no backend or database state changes.

## 4. Completion Gate

- [x] Payment form presentation is extracted; page owns state and API behavior.
- [x] Existing payment workflow integration test passes.
- [x] Lint, full frontend suite, and production build pass.
- [x] Only M10 task and frontend paths are staged and committed.
