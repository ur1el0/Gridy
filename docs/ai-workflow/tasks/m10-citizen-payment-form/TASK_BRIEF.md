# Task Brief: Extract Citizen Document Payment Reference Form

## 1. Metadata

- **Task ID:** `m10-citizen-payment-form`
- **Task Type:** Frontend refactor
- **Target Component:** Citizen document payment submission
- **Lead / implementer / reviewer:** Codex (temporary sole-agent mode)
- **Branch:** `refactor/citizen-document-payment-form`

## 2. Objective & Scope

- **Goal:** Extract the inline e-payment reference form from the citizen documents page into a focused controlled component.
- **Non-goals:** No changes to payment eligibility, validation, endpoint/payload, success/error handling, request updates, design, dependency set, production state, or unrelated files.
- **Context:** After M9 extracted the clearance request modal, the 415-line page still contains a distinct payment recipient/reference form nested in its request table. This form is a clear UI boundary while its state and API workflow remain page-owned.

## 3. Current Behavior & Evidence

- `CitizenDocuments.tsx` owns recipient/reference state and submits `POST /document-requests/{id}/payment-reference/` with `{ payment_recipient_id, payment_reference }`.
- Inline UI presents recipient options, selected recipient payment instructions, reference input, empty-recipient guidance, and submit pending state.
- The existing page test selects a recipient, enters a reference, and asserts the endpoint and body.

## 4. Required Architectural Rules

- Keep request eligibility conditions, state, validation, API call, toast handling, and server response merge in `CitizenDocuments`.
- Move only the form presentation and controlled-input callbacks into the child component.
- Preserve the current copy, classes, labels, empty-recipient state, and pending behavior.
- Do not alter payment/security or tenant-isolation rules.

## 5. Observable Acceptance Criteria

1. [x] The payment-reference form is extracted under `frontend/src/components/citizen-documents/`.
2. [x] `CitizenDocuments` retains payment state and submit/API behavior; the extracted component receives values and callbacks.
3. [x] Existing payment-reference integration test passes with the same URL and payload.
4. [x] Frontend lint, full test suite, and production build pass.
5. [x] Only M10 task and frontend paths are included in the local checkpoint; no push or deployment occurs.

## 6. Relevant Files

- `frontend/src/pages/citizen/CitizenDocuments.tsx`
- `frontend/src/pages/citizen/CitizenDocuments.test.tsx`
- `frontend/src/components/citizen-documents/`
- `docs/ai-workflow/tasks/m10-citizen-payment-form/PLAN.md`
- `docs/ai-workflow/tasks/m10-citizen-payment-form/STATUS.md` (local ignored status log)

## 7. Risks & Mitigations

- **Payment contract drift:** Retain the current integration test and verify its exact POST URL/body after extraction.
- **State or gating drift:** Keep state and the conditional eligibility logic in the page; only move the nested form subtree.
