# Task Brief: Extract Admin Dashboard Presentation Components

## 1. Metadata

- **Task ID:** `m11-admin-dashboard-components`
- **Task Type:** Frontend refactor
- **Target Component:** Barangay admin dashboard
- **Lead / implementer / reviewer:** Codex (temporary sole-agent mode)
- **Branch:** `refactor/admin-dashboard-components`

## 2. Objective & Scope

- **Goal:** Break the large admin dashboard render tree into focused presentation components while preserving its data loading and role-navigation behavior.
- **Non-goals:** No API changes, metric or chart calculation changes, redesigned visuals, new dependencies, backend changes, or production actions.
- **Context:** M6 classified `Dashboard.tsx` as a large single dashboard page and deferred extraction until a page-level characterization test existed. The current file is 427 lines and has no dedicated test.

## 3. Current Behavior & Evidence

- The page fetches `/dashboard/summary/` and `/activities/`, derives chart series, renders four metric cards, charts, and a five-row appointments feed.
- DILG admins are redirected to `/dilg-analytics` and do not render the barangay dashboard.
- Existing frontend tests do not reference `Dashboard.tsx` or its summary endpoint.

## 4. Required Architectural Rules

- Keep API loading, abort cleanup, summary/activity state, chart-series derivation, and DILG navigation in `Dashboard`.
- Extract presentational boundaries for metric cards, incident scenarios, demographics, and appointments.
- Preserve existing text, data formatting, colors, loading behavior, table ordering/limit, links, and responsive classes.
- Keep shared data contracts in a non-component type module.

## 5. Observable Acceptance Criteria

1. [x] Add characterization coverage for barangay metrics/activity rendering and DILG redirection before extracting presentation.
2. [x] Extract dashboard presentation into focused components without moving the page's fetch/navigation orchestration or changing rendered content.
3. [x] Existing baseline frontend suite and new dashboard tests pass.
4. [x] Frontend lint and production build pass.
5. [x] Only M11 task and dashboard-related files are included in the local checkpoint; no push or deployment occurs.

## 6. Relevant Files

- `frontend/src/pages/admin/Dashboard.tsx`
- `frontend/src/pages/admin/Dashboard.test.tsx` (new)
- `frontend/src/components/admin-dashboard/` (new)
- `docs/ai-workflow/tasks/m11-admin-dashboard-components/PLAN.md`
- `docs/ai-workflow/tasks/m11-admin-dashboard-components/STATUS.md` (local ignored status log)

## 7. Risks & Mitigations

- **Behavior drift:** Characterize visible metric values, activity row, and role redirect before moving JSX; preserve the API caller in the page.
- **Chart tests in JSDOM:** Assert user-visible metrics and activities rather than chart layout or SVG internals.
