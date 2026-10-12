# Status — M63 Activities Load Error Recovery

## Summary

- **Task ID:** `m63-activities-load-error-states`
- **State:** In progress
- **Milestone:** M1 — Regression tests
- **Branch:** `test/m63-activities-load-errors`
- **Base:** M62 PR #193 head `c01a05907a9a805b5ef6d846abce3d24d3587694`
- **Worktree:** `/tmp/gridy-m62-reliability-audit` (isolated clone; primary checkout unchanged)

## Baseline evidence

- `Activities.fetchActivities()` catches GET failures and sets an error string.
- The page-level error return hides the page header and Schedule Activity control and has no accessible alert or retry.
- The same list loader runs after successful creation, so a failed follow-up GET also hides previously loaded activity cards.
- The existing `InlineErrorState` is the established accessible retry UI in this frontend.
- Hindsight knowledge listing/search were attempted; the service refused connections at `127.0.0.1:9077`. Planning uses current source and repository task history.

## Plan amendment

While refining the implementation, source inspection showed that the same GET loader runs after successful creation. The M63 contract was narrowly amended to keep existing cards visible alongside the retry alert if that follow-up read fails. A focused regression test was added before application changes.

## Milestone log

| Milestone | Status | Evidence |
| --- | --- | --- |
| M1 — Regression tests | Complete | Five focused cases. Initial pre-implementation run: 1 file, 3 failed and 1 passed. After adding the follow-up-refresh preservation case, the pre-implementation run: 1 file, 4 failed and 1 passed. Failures reproduce missing alert/retry, hidden scheduling action, and dropped known card; the successful-empty response passes. |
| M2 — Retryable error UI | Pending | — |
| M3 — Verification and delivery | Pending | — |

## Verification log

| Command | Actual result |
| --- | --- |
| `npm --prefix frontend run test -- src/pages/services/Activities.test.tsx` (initial pre-implementation run) | Expected red: 1 test file, 3 failed and 1 passed. Failed tests could not find `role="alert"`; the current page returned only plain error text. The successful-empty case passed. |
| `npm --prefix frontend run test -- src/pages/services/Activities.test.tsx` (after adding refresh-preservation coverage, before implementation) | Expected red: 1 test file, 4 failed and 1 passed. In addition to the missing alert/retry, the failed follow-up GET caused the old activity card to disappear. The successful-empty case passed. |
| `git diff --check` | Passed with no whitespace errors for the M1 test and task packet. |

## Files

- `frontend/src/pages/services/Activities.tsx`
- `frontend/src/pages/services/Activities.test.tsx`
- `docs/ai-workflow/tasks/m63-activities-load-error-states/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m63-activities-load-error-states/PLAN.md`
- `docs/ai-workflow/tasks/m63-activities-load-error-states/STATUS.md`

## Safety

- M1 changed only regression tests and the task packet; application source was unchanged during the red-phase runs.
- Tests use mocked API calls. No production services or data are accessed.
- No schema, dependency, or infrastructure changes are planned. Azure pilot remains NO-GO.
