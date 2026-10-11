# Audit Plan: Post-Modularity Source Rescan

> **Work contract:** This is a read-only audit. Do not edit application or test source. Record measured file inventory, concrete classifications, verification results, and the next scoped milestone if justified.

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Task ID:** `m13-post-modularity-audit`
- **Target Branch:** `audit/post-modularity-rescan`
- **Complexity:** Low to medium

## 2. Milestone 1: Reconcile the Current Source Inventory

- **Objective:** Identify current large files and classify remaining refactor opportunities after M7–M12.
- **Files:** Read source and prior audit/task artifacts; add `AUDIT.md`, `TASK_BRIEF.md`, and `PLAN.md`; local ignored `STATUS.md` records checks.
- **Actions:**
  1. Count current source/test lines under `backend/`, `frontend/src/`, and `mobile/lib/`, excluding migrations and build output from source candidates.
  2. Inspect each current file over 300 lines for cohesive ownership, existing extracted components, and shared API/data contracts.
  3. Reconcile M6 findings against committed M7–M12 changes.
  4. Run frontend lint and full frontend tests on the current baseline; record actual output.
  5. Confirm no source changes, no staged paths, and clean diff hygiene.
- **Validation commands:**
  ```bash
  npm --prefix frontend run lint
  npm --prefix frontend run test
  git diff --check
  git diff --cached --name-only
  ```
- **Expected outcome:** A current evidence-based inventory and a specific next recommendation, or a documented conclusion that remaining >300-line modules are cohesive and should not be split by size alone.

## 3. Completion Gate

- [ ] Current large-file inventory and classifications are recorded in `AUDIT.md`.
- [ ] Historical M6 results and M7–M12 outcomes are reconciled.
- [ ] Frontend lint/tests pass; application/test source remains unchanged.
- [ ] No unrelated file is staged or modified.
