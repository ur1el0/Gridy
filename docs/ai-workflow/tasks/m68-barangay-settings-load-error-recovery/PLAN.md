# Implementation Plan: M68 — Barangay Settings Load Error Recovery

## Overview
- **Brief:** `TASK_BRIEF.md`
- **Branch:** `fix/m68-barangay-settings-load-error-recovery`
- **Base:** M67 delivery head `bb1b01b`
- **Complexity:** Low to medium

## Milestones

### M1 — Regression coverage
1. Add tests for initial settings GET failure and an empty successful response, accessible retry, hidden blank form/save action, and continued availability of the independent payment-recipient section.
2. Cover repeated retry failure followed by success, and the disabled pending-retry state.
3. Run the focused test file against the baseline and record the expected red result in `STATUS.md`.

**Validation:** `npm --prefix frontend run test -- src/pages/admin/BarangaySettings.test.tsx`

### M2 — Recover settings load state
1. Add explicit settings-load error and retry-pending state; keep initial loading behavior.
2. Use the existing `InlineErrorState` for a generic load error.
3. While the barangay record is unavailable, keep the page heading and payment-recipient section rendered but suppress the identity form and its no-op save button.
4. Retry only the existing GET. On success, populate the same fields, clear the error, and restore the form.
5. Leave multipart PATCH handling and theme update behavior unchanged.

**Validation:** Re-run focused settings tests and inspect the complete diff.

### M3 — Full verification and delivery
1. Run full frontend tests, lint, production build, and `git diff --check`.
2. Confirm only `BarangaySettings.tsx`, its test, and the M68 task packet changed.
3. Commit, push, and open a PR stacked on M67 PR #198 without merging.
4. Record actual hosted checks in `STATUS.md` and verify checks on the final PR head.

## Risks and controls
- **False editable form:** Do not render blank settings or a Save button when no barangay record was loaded.
- **Unrelated settings outage:** Keep `PaymentRecipientSettings` visible and independently functioning.
- **Retry mutation:** Assert retries call only the barangay GET and not PATCH.
- **Behavior drift:** Preserve the current successful response mapping, multipart form payload, and theme update path.
- **Boundary drift:** No backend, RBAC, tenant query, schema, or dependency changes.
