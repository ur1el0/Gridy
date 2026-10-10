# Task Brief: Extract Citizen Clearance Request Modal

## 1. Metadata

- **Task ID:** `m9-citizen-documents-modal`
- **Task Type:** Frontend refactor
- **Target Component:** Citizen document requests
- **Lead / implementer / reviewer:** Codex (temporary sole-agent mode)
- **Branch:** `refactor/citizen-documents-components`

## 2. Objective & Scope

- **Goal:** Extract the inline new-clearance modal from `CitizenDocuments` into a focused component while leaving form state, validation, API submission, and page orchestration in the page.
- **Non-goals:** No API or behavior changes, no payment/list extraction, no visual redesign, no new dependency, no production action, and no edits to `.agents/`, `.codex/`, or unrelated files.
- **Context:** The M6 audit found `CitizenDocuments.tsx` is a large page. Its request modal is a bounded UI subtree that can be isolated without splitting the coupled request/payment data flow.

## 3. Current Behavior & Evidence

- The page owns `documentType`, `purpose`, and `submitting` state and `handleCreateRequest()` validation and API flow.
- The modal markup is rendered inline near the end of `frontend/src/pages/citizen/CitizenDocuments.tsx`; its choices come from `DOCUMENT_TYPES`.
- `CitizenDocuments.test.tsx` currently covers the payment-reference workflow but not request creation.

## 4. Required Architectural Rules

- Keep state, validation messages, toast behavior, endpoint/payload, modal open/close behavior, and request refresh in `CitizenDocuments`.
- Move only modal presentation and controlled-input wiring to a focused child component.
- Keep labeled controls and semantic form/button elements accessible.
- Preserve existing typography, copy, classes, and behavior.

## 5. Observable Acceptance Criteria

1. [x] The request modal is extracted into a focused component under `frontend/src/components/citizen-documents/`, with shared document type options in a separate module.
2. [x] `CitizenDocuments` remains responsible for state and submit behavior; the extracted component receives controlled values and callbacks.
3. [x] A page-level test covers opening the modal and successfully submitting the selected document type and purpose, preserving the existing API contract.
4. [x] The existing payment-reference test remains passing; frontend lint, full test suite, and production build pass.
5. [x] Only M9 scoped files are staged in its local checkpoint; no push or deployment occurs.

## 6. Relevant Files

- `frontend/src/pages/citizen/CitizenDocuments.tsx`
- `frontend/src/pages/citizen/CitizenDocuments.test.tsx`
- `frontend/src/components/citizen-documents/`
- `docs/ai-workflow/tasks/m9-citizen-documents-modal/PLAN.md`
- `docs/ai-workflow/tasks/m9-citizen-documents-modal/STATUS.md` (local ignored status log)

## 7. Risks & Mitigations

- **Behavior drift at the callback boundary:** Add a page-level characterization test that checks the existing endpoint and payload and run the full frontend suite.
- **Unrelated visual churn:** Move the JSX as-is and keep its original content and classes.
