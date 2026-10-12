# M58 — Bound DILG Analytics Query Growth

## 1. Metadata

- **Task ID:** `m58-dilg-analytics-query-scaling`
- **Task Type:** Performance refactor with regression tests
- **Target Component:** Django REST API (`gridy_services`)
- **Implementer / Reviewer:** Codex (user-directed sole-agent mode)
- **Branch:** `fix/m58-dilg-analytics-query-scaling`
- **Base:** M57 branch `fix/m57-data-load-error-states`, commit `1cb4ecb`

## 2. Objective & Scope

- **Goal:** Make DILG analytics database query count bounded independently of the number of barangays, while preserving current response fields, values, ordering, and access controls.
- **Non-goals:** No API response changes, metric-definition changes, authorization changes, caching, schema/migration changes, dependency additions, Azure work, or production operations.
- **Problem:** `DILGAnalyticsView.get()` runs counts inside a loop over every barangay. Its database query count therefore grows linearly with barangay count.

## 3. Current Behavior & Evidence

- `backend/gridy_services/analytics.py` lists barangays, then issues separate resident, document, queue, category, and incident-time count queries per barangay.
- For document counts, the existing attribution predicate is `user__barangay=barangay OR barangay=barangay`, followed by `distinct()`. Preserve its exact behavior, including counting a request against each distinct barangay represented by those two relations if they differ, and counting it only once when both resolve to the same barangay.
- Existing endpoint tests are in `backend/gridy_services/tests/test_analytics.py`; they cover DILG-only access and digital/walk-in pending/released document counts.

## 4. Required Rules

- Preserve `IsAuthenticated` and `IsDILGAdmin`; do not broaden access or change the all-barangay DILG view.
- Keep existing counts, filters, time-hour boundaries, response shape, and `Barangay.name` ordering.
- Do not add Celery/Redis or other background/query infrastructure.
- No production database access or writes. Verification uses the configured local test database.

## 5. Acceptance Criteria

1. [ ] The analytics endpoint uses a fixed number of aggregate queries rather than querying per barangay.
2. [ ] A regression test proves endpoint query count stays constant as barangays are added.
3. [ ] Tests prove all existing response fields and metrics remain correct, including verified residents, pending/released document requests, priority/regular tickets, all five issue categories, and night-hour incidents (`>=22` or `<5`).
4. [ ] Document counts preserve the prior OR-plus-distinct attribution behavior, including same-barangay de-duplication and differing user/request barangays.
5. [ ] Existing DILG RBAC behavior is unchanged and covered.
6. [ ] No schema, migrations, dependencies, or unrelated application behavior are changed.
7. [ ] Focused and full backend checks pass and exact outcomes are recorded in `STATUS.md`.

## 6. Files & Verification

- **Expected application files:** `backend/gridy_services/analytics.py`, `backend/gridy_services/tests/test_analytics.py`
- **Task packet:** this file, `PLAN.md`, `STATUS.md`
- **Verification:** focused analytics tests, full backend pytest suite, Django check, migration dry-run, and `git diff --check`.

## 7. Risks

- Aggregate joins can silently change counts through row multiplication. Keep each metric family in its own grouped query and explicitly preserve document attribution semantics.
- Hour extraction behavior must match the old ORM `__hour` filters under the configured timezone.
- Query-count assertions can become brittle if they rely on authentication/session setup. Measure the same authenticated endpoint path at two barangay counts and compare totals, with authentication setup outside the capture window.
