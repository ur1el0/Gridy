# Implementation Plan — M58 DILG Analytics Query Scaling

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target Branch:** `fix/m58-dilg-analytics-query-scaling`
- **Base:** M57 branch `fix/m57-data-load-error-states` at `1cb4ecb` (M57 PR #188 remains open and unmerged).
- **Complexity:** Medium
- **Boundary:** Backend analytics implementation and tests, plus this task packet.

## 2. Milestones

### M1 — Regression coverage, grouped aggregation, verification, and delivery

**Actions**

1. Extend `DILGAnalyticsAPITests` to cover every response metric, night-hour boundaries, and document attribution/deduplication semantics.
2. Add a query-scaling test that captures the authenticated endpoint query count with a small and larger barangay set and asserts that the count remains constant and bounded.
3. Run the focused tests against the existing implementation and record the expected scaling-test failure before changing application code.
4. Replace the per-barangay count loop with a barangay list query and fixed grouped aggregation queries for residents, documents, queue tickets, and issue reports.
5. Assemble the same response shape in the existing barangay name order; retain the endpoint permission classes and all metric filters.
6. Run focused and full backend tests, Django checks, migration dry-run, and diff hygiene checks. Inspect the complete diff for schema/dependency/unrelated changes.
7. Update `STATUS.md`, make a scoped local checkpoint commit, push the feature branch, and create a PR stacked on M57 PR #188. Leave all PRs open and unmerged.

**Validation commands**

```bash
venv/bin/pytest backend/gridy_services/tests/test_analytics.py
venv/bin/pytest backend
DEBUG=True venv/bin/python backend/manage.py check
DEBUG=True venv/bin/python backend/manage.py makemigrations --check --dry-run
git diff --check
git status --short --branch
```

**Expected outcome:** Query count is independent of barangay count; the full endpoint contract and permission behavior are preserved; no migrations or dependency changes exist.

## 3. Risks & Rollback

- Use one grouped aggregate per metric family to avoid multiplication between reverse relations.
- For document requests, group by both user barangay and explicit request barangay, then attribute each aggregate row once to each distinct matching in-scope barangay. This matches the existing OR predicate plus `distinct()` semantics.
- Rollback is reverting the focused M58 application commit; no database rollback is needed.

## 4. Plan Amendments

- None at baseline. If test evidence reveals existing behavior differs from the contract above, record the evidence and revise this plan before changing metric semantics.
