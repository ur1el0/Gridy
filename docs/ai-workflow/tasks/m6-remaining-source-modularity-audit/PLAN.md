# Plan: Remaining Source Modularity Audit

> **Work contract:** This is a read-only audit. Do not change application source or stage files. Codex is the sole planner and auditor until the user restores agent collaboration.

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Task ID:** `m6-remaining-source-modularity-audit`
- **Target Branch:** `audit/remaining-source-modularity`
- **Complexity:** Medium
- **Output:** `AUDIT.md` with inventory, evidence, and a single prioritized follow-on candidate or a no-refactor recommendation.

## 2. Audit Milestone

### Milestone 1: Inventory and Triage Remaining Large Application Modules

- **Objective:** Determine whether remaining large source files violate the project’s modularity rule in a way that has a clear, safe extraction seam.
- **Files to inspect:**
  - Tracked `.py`, `.ts`, `.tsx`, and `.dart` application files over roughly 300 lines.
  - Existing page components and extracted feature components relevant to each candidate.
  - M4 modularization plan/status and architecture rules.
- **Actions:**
  1. Generate reproducible tracked-file inventories for production source and test modules, excluding assets, generated code, lockfiles, and third-party sources.
  2. Group candidates by backend, frontend, and mobile; inspect declarations, responsibilities, imports, state ownership, test-domain cohesion, and existing extracted modules.
  3. Classify each file as **Refactor**, **Keep cohesive**, or **Defer** with path and line evidence. Treat line count as a triage signal only.
  4. Identify the highest-value cohesive seam, estimate behavior/security risks, and define the smallest validation suite for a later implementation branch.
  5. Record findings and actual read-only checks in `AUDIT.md` and `STATUS.md`.
- **Validation commands:**
  ```bash
  git status --short
  git ls-files '*.py' '*.ts' '*.tsx' '*.dart'
  git diff --check
  git diff --cached --name-only
  ```
- **Expected outcome:** A complete candidate inventory with evidence, no source edits, and no staged paths.

## 3. Completion Gate

- [ ] Every qualifying tracked source and test-module candidate is listed and classified.
- [ ] Recommendations cite responsibilities and cohesive boundaries, not only line counts.
- [ ] Application source and existing untracked workspace files are unchanged.
- [ ] No files are staged.
