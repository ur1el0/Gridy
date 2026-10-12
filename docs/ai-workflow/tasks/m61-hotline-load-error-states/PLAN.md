# Implementation Plan: M61 — Hotline Management Load Error State

## Overview

- **Task brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Delivery branch:** `fix/m61-hotline-load-error-states-delivery`
- **Base:** M60 delivery commit `2a2f2e06ddd5566c364c435d4bef55462aa480e7`, on PR #191's branch.
- **Complexity:** Low
- **Boundary:** Hotline management page, its focused tests, and this task packet.

## Milestones

### M1 — Add regression tests

1. Add a focused `HotlineManagement.test.tsx` covering initial GET failure (alert instead of empty-list text), same-endpoint retry through another failure and successful recovery, successful empty response, and retry pending state.
2. Assert Add Hotline remains available after failure and retry performs no POST or DELETE.
3. Run the focused tests before the page implementation and record the expected red result.

**Validation:**

```bash
npm --prefix frontend run test -- src/pages/admin/HotlineManagement.test.tsx
```

### M2 — Add retryable load error presentation

1. Track load failure and retry pending state separately from initial loading.
2. Reuse `InlineErrorState` in the list area; keep the page header and Add Hotline control available after the initial request settles with an error.
3. Retry only `GET /hotlines/`; clear the error and update the list on success, preserve the error on failure, and retain successful empty/populated states.
4. Preserve the existing add and delete handlers and modal behavior.

**Validation:** rerun the focused Vitest command above.

### M3 — Full verification and delivery

1. Run the focused test, full frontend suite, lint, production build, and `git diff --check`.
2. Review the complete diff and confirm that only the page, focused tests, and M61 task packet changed; verify no staged files remain before committing.
3. Record actual commands/results and delivery metadata in `STATUS.md`.
4. Push the scoped delivery branch and open a PR against the M60 PR #191 branch, leaving it open and unmerged.

**Validation:**

```bash
npm --prefix frontend run test -- src/pages/admin/HotlineManagement.test.tsx
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
git diff --check
git diff --cached --name-only
git status --short --branch
```

## Risks and rollback

- Avoid rendering a valid-empty message after an API/network failure; only a successful empty response should show it.
- Keep the error/retry state in the list area so operators can still open the Add Hotline dialog.
- Roll back by reverting the scoped frontend change. No schema or data rollback is needed.

## Decisions

- Reuse the existing `InlineErrorState`; add no new component or dependency.
- Keep error copy generic and avoid surfacing exception details.
- Keep retry read-only and preserve the current API and mutation handlers.
