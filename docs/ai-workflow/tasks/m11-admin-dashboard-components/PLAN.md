# Implementation Plan: Admin Dashboard Presentation Extraction

> **Work contract:** This is a behavior-preserving React decomposition. Keep data fetching, navigation, and derived chart data in the page. Add characterization coverage first, then extract presentation, verify, record actual results, and create a scoped local checkpoint. Do not push or deploy.

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Task ID:** `m11-admin-dashboard-components`
- **Target Branch:** `refactor/admin-dashboard-components`
- **Complexity:** Medium

## 2. Milestone 1: Characterize Dashboard Behavior

- **Objective:** Add page-level tests for the primary barangay dashboard output and DILG role routing before moving presentation markup.
- **Files to modify:** Add `frontend/src/pages/admin/Dashboard.test.tsx`.
- **Detailed actions:**
  1. Render `Dashboard` under `AuthContext` and `MemoryRouter` using realistic mock responses.
  2. Assert that fetched resident/document/issue metrics and a scheduled activity are visible.
  3. Assert that DILG admins land on `/dilg-analytics` and no summary/activity requests are made.
  4. Run these tests against the existing implementation and record results before extracting components.
- **Validation command:**
  ```bash
  npm --prefix frontend run test -- src/pages/admin/Dashboard.test.tsx
  ```

## 3. Milestone 2: Extract Presentation Components

- **Objective:** Reduce the page render tree while preserving markup and page orchestration.
- **Files to modify:**
  - `frontend/src/pages/admin/Dashboard.tsx`
  - `frontend/src/pages/admin/Dashboard.test.tsx`
  - Add `frontend/src/components/admin-dashboard/MetricCards.tsx`.
  - Add `frontend/src/components/admin-dashboard/ScenarioBreakdownChart.tsx`.
  - Add `frontend/src/components/admin-dashboard/DemographicsCharts.tsx`.
  - Add `frontend/src/components/admin-dashboard/AppointmentsTable.tsx`.
  - Add shared dashboard response/series types in `frontend/src/components/admin-dashboard/types.ts` if required.
- **Detailed actions:**
  1. Move the metric card/skeleton, scenario chart/loading, demographics charts, and appointments table JSX into dedicated components.
  2. Keep API requests, cancellation, state, derived series, and DILG redirect in the page.
  3. Preserve existing labels, numerical formatting, chart data, colors, and table limit.
  4. Run targeted dashboard tests, the complete frontend suite, lint, build, and diff hygiene checks.
- **Validation commands:**
  ```bash
  npm --prefix frontend run test -- src/pages/admin/Dashboard.test.tsx
  npm --prefix frontend run test
  npm --prefix frontend run lint
  npm --prefix frontend run build
  git diff --check
  ```
- **Expected outcome:** Characterization tests pass before and after extraction; all existing frontend tests pass; page retains API and role behavior.

## 4. Risks & Rollback

- Recharts layout is not reliable in JSDOM; tests assert metrics and activity content, not chart geometry.
- Revert the local task checkpoint to restore the monolithic page; no database/API changes occur.

## 5. Completion Gate

- [x] Dashboard characterization tests pass before and after extraction.
- [x] Fetching, cancellation, chart-series derivation, and DILG redirect remain in the page.
- [x] Lint, full frontend suite, and production build pass.
- [x] Only scoped M11 files are staged and committed.
