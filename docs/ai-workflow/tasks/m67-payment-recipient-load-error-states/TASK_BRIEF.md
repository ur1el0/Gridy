# Task Brief: M67 — Payment Recipient Settings Load Error Recovery

## Metadata
- **Task ID:** `m67-payment-recipient-load-error-states`
- **Type:** Frontend bug fix
- **Target:** `frontend/src/pages/admin/PaymentRecipientSettings.tsx` and its focused test
- **Branch:** `fix/m67-payment-recipient-load-error-states`, based on M66 delivery head `a250030`
- **Lead / implementer / reviewer:** Codex (user-directed sole-agent mode)

## Goal
Make payment-recipient list failures visible and retryable without showing a false empty state or overwriting independent mutation feedback.

## Scope and non-goals
- Use the existing accessible `InlineErrorState` for `GET /payment-recipients/` failures.
- Preserve loaded recipients when a later list refresh fails.
- Keep load failure state separate from create/update action feedback.
- Retry only the existing list GET; preserve current form and recipient activation behavior.
- No backend/API, tenant-scope, RBAC, database/schema, dependency, infrastructure, or unrelated-page changes.

## Current behavior and evidence
`PaymentRecipientSettings.loadRecipients()` catches a failed list GET by setting the shared `message`, but then sets `loading` false. The render path consequently shows “No e-payment recipients configured. Cash collection remains available.” whenever `recipients` is empty, even though loading failed. The message is `role="status"` and has no retry control. After a successful create followed by a failed list refresh, the read error overwrites the create success message while the prior recipient list is preserved but not distinguished from a complete result.

Evidence: `frontend/src/pages/admin/PaymentRecipientSettings.tsx` — `loadRecipients`, `submit`, and the recipient-list rendering. Existing focused coverage in `PaymentRecipientSettings.test.tsx` covers only the create payload, not load failures.

## Required rules
- Keep the payment-recipient API contract and backend barangay scoping unchanged. `PaymentRecipientViewSet.get_queryset()` scopes records to the authenticated user’s barangay; this work does not alter it.
- Keep load errors generic and accessible.
- A retry must issue only `GET /payment-recipients/`; it must not create, patch, or otherwise mutate recipients.
- Do not clear known recipient rows on a read failure.
- Keep mutation feedback separate so a successful create remains reported even when its follow-up GET fails.

## Acceptance criteria
1. A failed initial list GET renders an accessible alert and retry button; it does not render the success-empty message.
2. The settings heading and existing recipient form remain available after a load failure.
3. Retry disables while its GET is pending. Repeated failures keep the alert visible; a successful retry clears it and renders the actual recipients or the genuine empty state.
4. If a later GET fails after recipients were loaded, those rows remain visible with the alert.
5. If POST create succeeds but the follow-up GET fails, the create success message and load error are both represented distinctly; existing rows remain visible.
6. Retrying calls only GET. Existing POST create and PATCH activation behavior and payloads remain unchanged.
7. No backend/API contract, tenant scope, RBAC, schema, dependency, infrastructure, or unrelated page changes.
8. Focused and full frontend tests, lint, production build, and diff hygiene are run and recorded with actual outcomes.

## Verification
- `npm --prefix frontend run test -- src/pages/admin/PaymentRecipientSettings.test.tsx`
- `npm --prefix frontend run test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `git diff --check`
