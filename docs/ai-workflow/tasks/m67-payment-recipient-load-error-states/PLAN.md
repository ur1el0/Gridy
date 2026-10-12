# Implementation Plan: M67 — Payment Recipient Settings Load Error Recovery

## Overview
- **Brief:** `TASK_BRIEF.md`
- **Branch:** `fix/m67-payment-recipient-load-error-states`
- **Base:** M66 delivery head `a250030`
- **Complexity:** Low to medium

## Milestones

### M1 — Regression coverage
1. Add tests for initial GET failure, visible form and non-empty-list context, no false empty state, retry-only GET behavior, retry-pending state, repeated failure/recovery, true empty state, and retained rows after a failed later read.
2. Add a create-success/follow-up-GET-failure test proving action success and list error remain distinct.
3. Run the focused test file against the baseline and record the expected failures in `STATUS.md`.

**Validation:** `npm --prefix frontend run test -- src/pages/admin/PaymentRecipientSettings.test.tsx`

### M2 — Separate and recover list state
1. Add explicit list load-error and retry-pending state, keeping mutation feedback independent.
2. Reuse `InlineErrorState` in the recipient list area and suppress the successful-empty text while a load error is active.
3. Make retry call only `GET /payment-recipients/`, disable the retry button while pending, and clear the load error only after successful list retrieval.
4. Keep recipient data unchanged in the GET catch path so stale known records remain visible.
5. Preserve the form, POST/PATCH behavior, payloads, page context, and backend contracts.

**Validation:** Re-run the focused test file and inspect the complete diff.

### M3 — Full verification and delivery
1. Run full frontend tests, lint, production build, and `git diff --check`.
2. Confirm the diff contains only the payment-recipient settings UI/test and this task packet; no backend, schema, or dependency changes.
3. Commit, push, and open a PR stacked on M66 PR #197 without merging.
4. Record actual CI and preview checks in `STATUS.md`, then verify checks on the final PR head.

## Risks and controls
- **False empty state:** Render the empty message only after a successful GET that returns no recipients.
- **Lost known data:** Do not replace recipient state in the GET failure path.
- **Feedback collision:** Keep load error and POST/PATCH action feedback in separate state.
- **Retry side effects:** Assert the retry event invokes GET only.
- **Boundary drift:** Do not change API paths, backend query scoping, RBAC, or payment workflows.
