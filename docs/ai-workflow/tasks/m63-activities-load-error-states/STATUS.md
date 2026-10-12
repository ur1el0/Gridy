# Status — M63 Activities Load Error Recovery

## Summary

- **Task ID:** `m63-activities-load-error-states`
- **State:** In progress — local verification complete; delivery pending
- **Milestone:** M3 — Verification and delivery
- **Delivery branch:** `fix/m63-activities-load-error-states-delivery`
- **Implementation checkpoint:** `459511f` on `fix/m63-activities-load-error-states`
- **Test checkpoint:** `94f7c98` on `test/m63-activities-load-errors`
- **Base:** M62 PR #193 head `c01a05907a9a805b5ef6d846abce3d24d3587694`
- **Worktree:** `/tmp/gridy-m62-reliability-audit` (isolated clone; primary checkout unchanged)

## Baseline evidence

- `Activities.fetchActivities()` caught GET failures and set an error string.
- The page-level error return hid the page header and Schedule Activity control and had no accessible alert or retry.
- The same list loader runs after successful creation, so a failed follow-up GET also hid previously loaded activity cards.
- The existing `InlineErrorState` is the established accessible retry UI in this frontend.
- Hindsight knowledge listing/search were attempted; the service refused connections at `127.0.0.1:9077`. Planning uses current source and repository task history.

## Plan amendment

Source inspection showed that the loader runs after successful creation as well as on initial mount. The M63 contract was narrowly amended to preserve existing cards beside the retry alert if that follow-up read fails; a regression test was added before application changes.

## Milestone log

| Milestone | Status | Evidence |
| --- | --- | --- |
| M1 — Regression tests | Complete | Five focused cases. Pre-implementation: initial run 3 failed/1 passed; after adding failed-follow-up-read preservation coverage 4 failed/1 passed. The latter reproduced the old card disappearing after a post-create GET failure. |
| M2 — Retryable error UI | Complete | Replaced the page-level early return with `InlineErrorState` in the list area, added retrying state, and clear the error on GET success. Focused tests pass. |
| M3 — Verification and delivery | In progress | All local frontend checks pass; final branch review and remote delivery are pending. |

## Verification log

| Command | Actual result |
| --- | --- |
| `npm --prefix frontend run test -- src/pages/services/Activities.test.tsx` (initial pre-implementation run) | Expected red: 1 test file, 3 failed and 1 passed. Failures could not find the accessible alert; successful-empty passed. |
| `npm --prefix frontend run test -- src/pages/services/Activities.test.tsx` (after adding preservation coverage, before implementation) | Expected red: 1 test file, 4 failed and 1 passed. The prior loaded activity card disappeared on failed post-create GET, and the page still lacked alert/retry UI. |
| `npm --prefix frontend run test -- src/pages/services/Activities.test.tsx` (after implementation) | Passed: 1 test file, 5 tests. Covers initial failure and scheduling access, repeat failure and data recovery, preservation on failed post-create reload, successful-empty response, and disabled retry without mutations. |
| `npm --prefix frontend run test` | Passed: 36 test files, 111 tests. |
| `npm --prefix frontend run lint` | Passed; exit code 0 with no Oxlint diagnostics. |
| `npm --prefix frontend run build` | Passed; TypeScript and Vite production build succeeded, 2,514 modules transformed in 906 ms. |
| `git diff c01a05907a9a805b5ef6d846abce3d24d3587694..HEAD --check` | Passed with no whitespace errors. |

## Scope review

- Changes are limited to `Activities.tsx`, its focused tests, and this M63 task packet.
- Retry calls only `GET /activities/`; successful list normalization and the create/delete handlers remain unchanged.
- On failed follow-up reads, previously loaded cards remain visible beside the alert.
- No backend/API contract, schema/migration, dependency, tenant/RBAC, or infrastructure changes. `package-lock.json` is unchanged.
- HTTP calls are mocked; no production data or cloud resources are touched. Azure pilot remains NO-GO.

## Delivery

- M1 and M2 are checkpointed separately. The delivery branch will be pushed as a PR based on M62 PR #193, leaving both PRs open and unmerged.
