# Implementation Plan: M60 — Aid Request History Load Error State

## Overview

- **Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `fix/m60-aid-request-load-error-states`
- **Base:** M59 branch `fix/m59-resident-load-error-states`, commit `f157770617edc67973ca8cd499ab80a4f0ba8b71` (PR #190)
- **Complexity:** Low
- **Boundary:** One page, its tests, and the task packet.

## Milestones

### M1 — Add regression coverage

1. Test that a failed list fetch shows the accessible error instead of the empty result.
2. Test repeated retry failure followed by recovery from the same endpoint.
3. Test successful empty responses remain empty states.
4. Test retry pending state disables the control and does not trigger POST/PATCH; preserve the resident request form.
5. Run the focused tests before UI changes and record the expected red result.

**Validation:**

```bash
npm --prefix frontend run test -- src/pages/citizen/AidRequests.test.tsx
```

### M2 — Add retryable error presentation

1. Track list-load failure and retry progress separately from initial loading.
2. Reuse `InlineErrorState` in the list region only, leaving the resident submission form visible.
3. Clear the error after a successful retry and preserve the current true-empty and populated results.
4. Keep the retry callback limited to the existing GET endpoint.

**Validation:** rerun the focused test command above.

### M3 — Full verification and delivery

1. Run focused tests, full frontend tests, lint, and production build.
2. Inspect the diff for preserved form and staff actions; confirm no backend/API/schema/dependency/tenant/RBAC/Azure changes; run `git diff --check`.
3. Record actual results and delivery metadata in `STATUS.md`.
4. Commit and push only the scoped page, tests, and task packet; open a PR against `fix/m59-resident-load-error-states` (M59 PR #190), leaving it open and unmerged.

**Validation:**

```bash
npm --prefix frontend run test -- src/pages/citizen/AidRequests.test.tsx
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
git diff --check
git diff --cached --name-only
git status --short --branch
```

## Risks and Rollback

- The page supports both resident and staff users. Keep the error branch scoped to the history area so it does not hide the resident submission form.
- The same loader is called after successful submissions; a later list reload failure should show the history error without undoing or misreporting the successful POST.
- Rollback is reverting the isolated frontend/test commit; no database rollback is needed.

## Decisions

- Reuse `InlineErrorState`; do not add a new error component or fetch abstraction.
- Show a generic message; keep server/network details out of the user-facing state.
