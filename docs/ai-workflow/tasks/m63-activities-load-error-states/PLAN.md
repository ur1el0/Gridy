# Implementation Plan: M63 — Activities Load Error Recovery

## Plan overview

- **Scope:** Activities page, focused Vitest coverage, and this task packet.
- **Base:** M62 PR #193 head `c01a05907a9a805b5ef6d846abce3d24d3587694`.
- **Risk:** Low; frontend presentation and request state only.
- **Delivery:** Keep PR #193 open and unmerged. Stack M63 on its delivery branch and open a separate PR against that branch.

## Milestone 1 — Regression tests

1. Add `Activities.test.tsx` for initial GET failure versus a successful empty response.
2. Verify Schedule Activity remains usable after failure.
3. Verify retry repeats only `/activities/`, remains visible after repeated failure, and recovers to populated data.
4. Verify a failed post-create list refresh preserves the existing activity cards and exposes a retry alert.
5. Verify pending retry is disabled and does not call POST or DELETE.
6. Run the focused test before implementation and record actual red results.

**Validation:** `npm --prefix frontend run test -- src/pages/services/Activities.test.tsx`

## Milestone 2 — Retryable error UI

1. Track retry state and clear/set the existing error based on GET outcomes.
2. Replace the page-level early return with `InlineErrorState` in the list area.
3. Keep the existing header and scheduling modal reachable during list errors.
4. When a follow-up GET fails after records are loaded, show the error while preserving those records.
5. Preserve the successful empty/populated list, create/delete logic, endpoint, and response normalization.
6. Rerun focused tests.

## Milestone 3 — Verification and delivery

1. Run the full frontend test suite, lint, and production build.
2. Check the complete M63 diff, `git diff --check`, staged scope, and package lock for unwanted changes.
3. Record actual commands and outputs in `STATUS.md`.
4. Create M1/M2/M3 checkpoint commits on separate branches; push the delivery branch and open a PR against `fix/m62-notification-load-error-states-delivery`. Leave PRs open/unmerged.

## Safety

- HTTP calls are mocked. No production data, cloud resources, deployments, migrations, or external services are touched.
- Azure pilot remains NO-GO.

## Plan amendment

During review of `Activities.tsx`, the loader was found to run after successful creation as well as on initial mount. The error path would therefore hide existing records if only the retry UI were added. The brief and tests were expanded narrowly to preserve already-loaded cards when that follow-up GET fails.
