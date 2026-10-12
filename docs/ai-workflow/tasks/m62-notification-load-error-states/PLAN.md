# Implementation Plan: M62 — Notifications Load Error State

## Plan overview

- **Scope:** `frontend/src/pages/community/Notifications.tsx`, its focused Vitest test, and this task packet.
- **Base:** M61 PR #192 head.
- **Risk:** Low; presentation and retry state only.
- **Delivery:** Keep the M61 PR open and unmerged. Stack M62 on its head and open a new PR against the M61 delivery branch.

## Milestone 1 — Regression tests

1. Add `Notifications.test.tsx` covering initial GET failure versus successful empty response.
2. Cover retry through repeated failure and eventual empty/populated success, exact GET path, and no mutation calls.
3. Cover disabled/pending retry state.
4. Run the focused test before implementation and record the real red result.

**Validation:** `npm --prefix frontend run test -- src/pages/community/Notifications.test.tsx`

## Milestone 2 — Retryable error UI

1. Track load error and retrying state in the page.
2. Show the existing `InlineErrorState` on GET failure and clear it only after a successful response.
3. Keep the page heading and action controls available; render the empty state only after a successful empty response.
4. Preserve the existing API path, list normalization, selection, and mutation handlers.
5. Rerun the focused test.

## Milestone 3 — Verification and delivery

1. Run the full frontend tests, lint, and production build.
2. Run `git diff --check`; inspect the final diff and confirm only scoped application/test/task files changed.
3. Record actual commands and results in `STATUS.md`.
4. Create milestone checkpoint commits on the test, implementation, and delivery branches; push only the delivery branch and open a PR against `fix/m61-hotline-load-error-states-delivery`. Do not merge either PR.

## Safety

- Tests use mocked HTTP calls only.
- No production services, data, deployments, migrations, or cloud resources are touched.
- Azure pilot remains NO-GO.
