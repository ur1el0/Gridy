# Implementation Plan: M66 — Document Requests Load Error Recovery

## Overview
- **Brief:** `TASK_BRIEF.md`
- **Branch:** `fix/m66-document-requests-load-error-states`
- **Base:** M65 delivery head `7a5b68e2564fab6fa11554d14154b90d0d3061fb`
- **Complexity:** Low to medium

## Milestones

### M1 — Capture regression behavior
1. Add focused tests for initial GET failure, retained page/walk-in action, GET-only retry/recovery, true empty response, pending retry, and preservation of rows after a failed post-create GET. Add a DocumentTable regression that its error row suppresses the empty row.
2. Run the test file before application changes and record the expected red baseline in `STATUS.md`.

**Validation:** `npm --prefix frontend run test -- src/pages/services/DocumentRequests.test.tsx src/components/documents/DocumentTable.test.tsx`

### M2 — Add retryable list error UI
1. Extend `fetchRequests` with an explicit retry flag and retry-pending state.
2. Preserve existing loading semantics: initial mount already begins in loading state; post-create refresh must not introduce a new full-page skeleton.
3. Clear errors after a successful list response.
4. Replace the page-level error return and pass an optional load-error presentation into `DocumentTable`, which owns the empty row; render the alert row there and suppress the successful-empty row while the error is active. Keep heading/action available.
5. Keep list data intact on GET failure and leave all mutation handlers unchanged.

**Validation:** Run the focused Document Requests tests.

### M3 — Full verification and delivery
1. Run full frontend tests, lint, production build, and `git diff --check`.
2. Self-review the diff and confirm only DocumentRequests, its focused tests, and the M66 task packet changed.
3. Commit, push, and open a PR stacked on M65 PR #196 without merging.
4. Record actual CI and Vercel/GitGuardian results and final delivery details in `STATUS.md`.

## Risks and controls
- **False empty state:** Suppress the empty table row while an error is active.
- **Lost requests:** Keep the requests array unchanged in the catch path.
- **Retry mutation:** Assert retry only invokes GET and not any write methods.
- **Post-create behavior drift:** Do not set initial loading back to true during a follow-up read; keep the current submit success, close, and form reset flow.
- **Delivery connectivity:** Complete local work and retry remote publication if GitHub is unavailable.

## Plan amendment — Table owns the empty state
Source inspection after the page-level red tests showed that `DocumentTable` independently renders “No clearance requests recorded yet.” when passed an empty array. The page cannot suppress that row while retaining the table and without a sentinel-data workaround. M66 therefore includes a small optional load-error prop on `DocumentTable` plus a focused component test; existing callers and ordinary table behavior remain unchanged.
