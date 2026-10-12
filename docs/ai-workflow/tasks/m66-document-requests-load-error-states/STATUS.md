# Status — M66 Document Requests Load Error Recovery

## Summary
- **Task ID:** `m66-document-requests-load-error-states`
- **State:** In Progress
- **Current milestone:** M3 — Full verification and delivery
- **Branch:** `fix/m66-document-requests-load-error-states`
- **Base:** M65 delivery head `7a5b68e2564fab6fa11554d14154b90d0d3061fb`
- **Primary checkout:** Preserved; all M66 work is isolated in `/tmp/gridy-m62-reliability-audit`.

## Baseline evidence
- `DocumentRequests.fetchRequests()` recorded a generic error after a failed `GET /document-requests/`.
- The page-level early return hid the heading, Request Walk-in action, existing request rows, and a retry path.
- The same loader runs after successful walk-in creation; a failed follow-up GET preserved the `requests` state, but the early return hid those rows.
- `DocumentTable` owns the success-empty row. The plan was amended to give it an optional load-error prop so a failed read is not presented as a successful empty result.
- Hindsight was unavailable in this session because its local service at `127.0.0.1:9077` refused the connection; implementation scope is grounded in the checked-in task documents and source.

## Milestone tracker
| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Regression behavior | Complete | Five page tests and one table test reproduced the failure state and empty-row conflict before implementation. |
| M2 — Retryable error UI | Complete | Error/retry row is owned by `DocumentTable`; page preserves initial loading and submit semantics. |
| M3 — Full verification and delivery | In Progress | Full frontend checks passed; final delivery steps remain. |

## Files
- `frontend/src/pages/services/DocumentRequests.tsx`
- `frontend/src/pages/services/DocumentRequests.test.tsx`
- `frontend/src/components/documents/DocumentTable.tsx`
- `frontend/src/components/documents/DocumentTable.test.tsx`
- `docs/ai-workflow/tasks/m66-document-requests-load-error-states/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m66-document-requests-load-error-states/PLAN.md`
- `docs/ai-workflow/tasks/m66-document-requests-load-error-states/STATUS.md`

## Verification log
### M1 — Red baseline
- `npm --prefix frontend run test -- src/pages/services/DocumentRequests.test.tsx` — expected red: 1 file, 5 failed against the original page-level error return.
- `npm --prefix frontend run test -- src/components/documents/DocumentTable.test.tsx` — expected red: 1 new test failed while 4 existing tests passed; the empty row remained and no accessible alert was rendered.

### M2 — Focused implementation
- **Command:** `npm --prefix frontend run test -- src/pages/services/DocumentRequests.test.tsx src/components/documents/DocumentTable.test.tsx`
- **Result:** PASS — 2 files, 10 tests.
- **Coverage:** Initial accessible failure with heading/table/action; repeated retry failure and recovery; genuine empty state; post-create GET failure preserving known rows and closing the modal; pending retry disabled and GET-only; table error row suppressing the successful-empty row.

### M3 — Full verification
- **Full frontend tests:** `npm --prefix frontend run test` — PASS, 39 test files and 126 tests; duration 11.58s.
- **Frontend lint:** `npm --prefix frontend run lint` — PASS, exit code 0 with no diagnostics.
- **Production build:** `npm --prefix frontend run build` — PASS (`tsc -b && vite build`); Vite transformed 2,514 modules and built in 1.03s.
- **Diff hygiene:** `git diff --check` and `git diff --cached --check` — PASS, no output.
- **Scope review:** Only the Document Requests page/table, their focused tests, and this M66 task packet are in scope. No backend, API, schema, dependency, infrastructure, or unrelated-page changes.
- **Parent readiness:** M65 final-head checks passed on runs `38188720241` and `38188722578` before stacking M66.

## Delivery
No M66 implementation commit, push, or PR yet. Azure pilot remains NO-GO; this task does not touch Azure or production infrastructure.
