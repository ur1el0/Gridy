# Task Brief: M71 Admin Dashboard Load Error Recovery

## Metadata
- **Task ID:** `m71-admin-dashboard-load-error-recovery`
- **Task type:** Frontend bug fix
- **Target:** Admin dashboard summary and activities reads
- **Branch:** `fix/m71-admin-dashboard-load-errors`
- **Base:** M70 PR head `7f97061f3c13ee21a29864f05b2e6502dc38bf9a`

## Goal
Make the Admin Dashboard distinguish failed data reads from valid zero or empty results, with independent retry for the summary and appointments data.

## Current behavior and evidence
`frontend/src/pages/admin/Dashboard.tsx` uses `Promise.allSettled` for `/dashboard/summary/` and `/activities/` but only handles fulfilled results. If the activities read fails, `AppointmentsTable` receives an empty array and says no appointments are scheduled. If the summary read fails, the metric and chart components receive missing data; in particular, `MetricCards` renders clearance collections as `₱0.00`, and the charts render without an error or retry state. Existing tests cover only successful loads and DILG redirection.

## Scope and non-goals
- Add independent error/retry handling for the two dashboard GET requests and focused tests.
- Preserve the page heading, action/navigation, successful dashboard behavior, DILG redirect, and existing cancellation behavior.
- Do not change API/backend behavior, data contracts, role permissions, mutations, database/schema, dependencies, infrastructure, or Azure configuration.

## Acceptance criteria
1. A failed summary GET is visibly an error with retry; the page does not present failed summary data as zero or empty charts. Successfully loaded appointments remain visible.
2. A pending activities GET shows loading rather than the successful-empty message. A failed GET is visibly an error with retry; the table does not present it as “No appointments or activities scheduled.” Successfully loaded summary metrics remain visible.
3. Each retry requests only its corresponding GET endpoint. Repeated failure remains visible; recovery clears the error and displays current data. The unaffected dashboard section retains its successfully loaded data throughout.
4. Retry controls are disabled while their own request is pending. No write requests are issued.
5. A successful empty activities response still renders the genuine empty state; DILG admins still redirect without issuing barangay dashboard requests.
6. No backend, schema, dependency, or infrastructure changes are introduced.

## Verification
- Red/green focused tests: `npm --prefix frontend run test -- src/pages/admin/Dashboard.test.tsx src/components/admin-dashboard/AppointmentsTable.test.tsx`
- Full frontend tests: `npm --prefix frontend run test`
- Lint: `npm --prefix frontend run lint`
- Production build: `npm --prefix frontend run build`
- Diff hygiene: `git diff --check`
