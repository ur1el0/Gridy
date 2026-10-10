# Implementation Plan: Frontend Route-Level Code Splitting

> **Work contract:** Codex is the sole planner, implementer, verifier, and reviewer until the user restores agent collaboration. Complete one milestone, record actual checks in `STATUS.md`, self-review the diff, and create a scoped local checkpoint. Do not push or deploy.

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Task ID:** `m5-frontend-route-code-splitting`
- **Target Branch:** `perf/frontend-route-code-splitting`
- **Complexity:** Medium
- **Behavior expectation:** Route and authorization behavior remains unchanged; only page module loading is deferred.
- **Schema expectation:** No database changes.

## 2. Milestone Breakdown

### Milestone 1: Lazy Route Pages and Verify the Production Entry

- **Objective:** Defer page-only code until its route is visited, provide an accessible pending state, and reduce the initial JavaScript entry below Vite's 500 kB advisory threshold.
- **Files to modify:**
  - `frontend/src/App.tsx`
  - `frontend/src/App.test.tsx`
  - `frontend/src/components/core/RouteLoadingFallback.tsx`
  - `frontend/src/components/core/RouteLoadingFallback.test.tsx`
- **Actions:**
  1. Replace static imports of route page modules with `React.lazy()` dynamic imports, adapting each module's named export to the lazy component default.
  2. Retain existing paths, nested layouts, redirects, and role guard lists without changing their order or conditions.
  3. Wrap the route tree in `Suspense` with a keyboard- and screen-reader-friendly loading status, and test the status while a deferred route chunk resolves.
  4. Add an `App` integration test that visits `/` while unauthenticated and waits for the login page to render through the route table.
  5. Run frontend checks and inspect generated JS chunks. If a chunk remains above the advisory threshold, identify its contents before considering a narrow additional split; do not raise the Vite threshold to hide the warning.
- **Validation commands:**
  ```bash
  npm --prefix frontend run lint
  npm --prefix frontend run test
  npm --prefix frontend run build
  git diff --check
  git diff --cached --name-only
  ```
- **Expected outcome:** Existing frontend tests pass; the new route and pending-state tests pass; production emits page chunks and an initial JS entry below 500 kB; lint and whitespace checks are clean; no files are staged before the scoped commit.

## 3. Risks and Rollback

- Browser deep links must still resolve through the existing Vercel/Nginx SPA fallback.
- React lazy chunk failures are handled by the existing `ErrorBoundary`; do not introduce a competing retry or network policy.
- If route behavior changes or the entry remains oversized without a clear safe split, record the build evidence in `STATUS.md` and revise the plan before expanding implementation scope.
- Roll back this milestone by reverting its local checkpoint commit; no data or infrastructure changes are involved.

## 4. Completion Gate

- [ ] Existing route strings and auth guard behavior match the pre-change table.
- [ ] New `App` route integration test passes.
- [ ] Pending-state test confirms the accessible fallback stays visible until the simulated chunk resolves.
- [ ] Lint and complete frontend test suite pass.
- [ ] Build output confirms separate page chunks and a sub-500 kB initial JS entry.
- [ ] `git diff --check` is clean and unrelated untracked content is absent from the staged path list.
