# Implementation Plan: M65 — Issue Reports Load Error Recovery

## Overview
- **Brief:** `TASK_BRIEF.md`
- **Branch:** `fix/m65-issue-reports-load-error-states`
- **Base:** M64 PR #195 head `134a30704bf8b1bbaba06b0cedfa0310bca76eb8`
- **Complexity:** Low

## Milestones

### M1 — Capture regression behavior
1. Add focused tests for failed initial load, retained page/table context, GET-only repeated retry and recovery, successful empty result, and disabled pending retry.
2. Run the focused test file before application changes and record the expected red baseline in `STATUS.md`.

**Validation:** `npm --prefix frontend run test -- src/pages/services/IssueReports.test.tsx`

### M2 — Add retryable list error UI
1. Move the existing loader into component scope so the retry control can call it.
2. Track retry pending separately from initial page loading.
3. Clear the error when `GET /reports/` succeeds.
4. Render `InlineErrorState` within the existing report table context and suppress the success-empty row while the load error is active.
5. Leave status update and detail/lightbox behavior unchanged.

**Validation:** Run the focused Issue Reports tests.

### M3 — Full verification and delivery
1. Run full frontend tests, lint, production build, and `git diff --check`.
2. Self-review the complete diff; verify only Issue Reports, its focused test, and this task packet changed.
3. Commit, push, and open a PR stacked on M64 PR #195 without merging.
4. Record actual hosted check results and final delivery details in `STATUS.md`.

## Risks and controls
- **False empty state:** Render the empty row only after a successful response.
- **Retry mutation:** Assert retries make no `PATCH` calls.
- **Scope drift:** Do not alter the status update/detail/lightbox flows or API contract.
- **Delivery network unavailable:** Keep the branch and local verification intact, then retry publication when GitHub connectivity returns.
