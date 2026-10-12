# Task Brief: M68 — Barangay Settings Load Error Recovery

## Metadata
- **Task ID:** `m68-barangay-settings-load-error-recovery`
- **Type:** Frontend bug fix
- **Target:** `frontend/src/pages/admin/BarangaySettings.tsx` and its focused test
- **Branch:** `fix/m68-barangay-settings-load-error-recovery`, based on M67 delivery head `bb1b01b`
- **Lead / implementer / reviewer:** Codex (user-directed sole-agent mode)

## Objective and scope
Show a failed `GET /auth/barangay/`, or a successful response with no barangay record, as a retryable, accessible error instead of leaving an uneditable blank identity form with a Save button that silently does nothing. Preserve the independent payment-recipient settings section and all existing successful load/save behavior.

## Current behavior and evidence
`BarangaySettings` catches a failed `/auth/barangay/` request only by logging to the console, then sets `loading` false. It renders empty identity values and a Save button, while `handleSubmit` returns immediately because `barangayId` is null. The page offers no user-facing recovery control. The error path does not affect the child `PaymentRecipientSettings`, which has its own endpoint and should remain available.

A successful but empty list response has the same missing-record outcome: no `barangayId`, blank identity values, and a Save button that silently returns. Treat it as an unavailable settings record as well.

Evidence: `frontend/src/pages/admin/BarangaySettings.tsx` — initial fetch effect, `handleSubmit` guard, `loading` return, and identity form. Existing test coverage in `frontend/src/pages/admin/BarangaySettings.test.tsx` covers successful load/save only.

## Rules and non-goals
- Reuse the existing accessible `InlineErrorState` and make retry issue only `GET /auth/barangay/`.
- On identity-load failure, keep the page heading and `PaymentRecipientSettings` visible; do not show blank identity fields or a no-op Save Settings action.
- Keep initial loading behavior, multipart PATCH payload, theme update, tenant scope, and backend RBAC/API behavior unchanged.
- No backend/API, database/schema, dependency, infrastructure, payment-recipient, or unrelated-page changes.

## Acceptance criteria
1. An initial `/auth/barangay/` failure or successful empty response shows an accessible alert with retry; it does not display the identity edit form or Save Settings action.
2. The Barangay Identity Settings heading and independent Electronic payment recipients section remain available after the failure.
3. Retry is disabled while pending, issues only `GET /auth/barangay/`, and repeated failures remain visible.
4. Successful retry clears the error and renders the returned barangay settings, restoring the existing form.
5. Existing successful multipart save and theme update behavior remain unchanged.
6. No backend/API, tenant/RBAC, schema, dependency, infrastructure, or unrelated-page changes.
7. Focused/full frontend tests, lint, production build, and diff hygiene are run and logged with actual results.

## Verification
- `npm --prefix frontend run test -- src/pages/admin/BarangaySettings.test.tsx`
- `npm --prefix frontend run test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `git diff --check`
