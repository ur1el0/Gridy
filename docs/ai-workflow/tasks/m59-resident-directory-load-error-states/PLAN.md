# Implementation Plan: M59 — Resident Directory Load Error States

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target Branch:** `fix/m59-resident-load-error-states`
- **Base:** M58 checkpoint `752467f8213ea9b0c253b63f7e8512b0d7edee3d`; PR #189 remains open and unmerged.
- **Complexity:** Low to Medium
- **Implementation Boundary:** Two resident-list pages and their Vitest coverage, plus this task packet.

## 2. Milestones

### Milestone 1 — Regression tests for failure, retry, and empty outcomes

- **Objective:** Prove each page does not present a failed fetch as a successful empty result and that retry recovers.
- **Files:**
  - `frontend/src/pages/community/ResidentsManagement.test.tsx`
  - `frontend/src/pages/community/ResidentVerification.test.tsx`
- **Actions:**
  1. Add tests for initial request rejection, visible accessible alert, and absence of the existing empty-result text/count.
  2. Retry the same endpoint and verify a successful populated response clears the alert and renders records.
  3. Verify successful empty payloads still render the existing legitimate empty states.
  4. Run both test files before implementation and record the expected red result.
- **Validation:**
  ```bash
  npm --prefix frontend run test -- src/pages/community/ResidentsManagement.test.tsx src/pages/community/ResidentVerification.test.tsx
  ```
- **Expected Outcome:** New failure/retry assertions fail against current behavior for the expected missing-alert reason; successful-path tests remain green.

### Milestone 2 — Add retryable load error presentation

- **Objective:** Expose errors and retries without changing the successful page behavior.
- **Files:**
  - `frontend/src/pages/community/ResidentsManagement.tsx`
  - `frontend/src/pages/community/ResidentVerification.tsx`
- **Actions:**
  1. Track load failure and retry-in-progress separately from initial loading.
  2. Reuse the existing `InlineErrorState` component for an accessible, generic message and retry action.
  3. On retry success, update list data and clear the error; on retry failure, retain the error and allow another retry.
  4. In verification, do not render a zero pending count while the initial list is unavailable.
  5. Keep current empty states for successful empty payloads and preserve all existing list, filter, import, approval, and rejection flows.
- **Validation:**
  ```bash
  npm --prefix frontend run test -- src/pages/community/ResidentsManagement.test.tsx src/pages/community/ResidentVerification.test.tsx
  ```
- **Expected Outcome:** Focused regression tests pass; no exception text is displayed.

### Milestone 3 — Full verification and delivery

- **Objective:** Verify the two-screen change, record actual results, and deliver a scoped stacked PR.
- **Actions:**
  1. Run full frontend tests, lint, and production build.
  2. Inspect the diff and confirm no backend/API/schema/dependency or unrelated changes; run `git diff --check`.
  3. Update `STATUS.md` with exact commands, outputs, commit and push details, PR base/head, and hosted check status.
  4. Commit only the four in-scope frontend files and this task packet; push the new branch and open a PR against `fix/m58-dilg-analytics-query-scaling`, leaving it unmerged.
- **Validation:**
  ```bash
  npm --prefix frontend run test
  npm --prefix frontend run lint
  npm --prefix frontend run build
  git diff --check
  git diff --cached --name-only
  git status --short --branch
  ```
- **Expected Outcome:** All local checks pass; the only production behavior change is visible load-failure/retry presentation on the two resident screens; Azure stays NO-GO.

## 3. Risks & Rollback

- Reusing `InlineErrorState` keeps behavior consistent with M57; its retry button already exposes a disabled/retrying state.
- The verification summary must not imply zero residents during failed loading; hide its count while the load error is active.
- Rollback is reverting the isolated M59 UI/test commit. No database rollback is involved.

## 4. Architectural Decisions

- Reuse the existing inline error component rather than introducing a global data-fetch abstraction or a new component.
- Use generic screen-specific messages; keep raw API/network exception details in the console only.
- Keep M59 scoped to the two resident staff list screens evidenced in the audit.
