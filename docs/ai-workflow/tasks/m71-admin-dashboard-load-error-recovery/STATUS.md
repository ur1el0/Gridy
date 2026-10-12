# Status: M71 Admin Dashboard Load Error Recovery

## Summary
- **Task ID:** `m71-admin-dashboard-load-error-recovery`
- **State:** In Progress
- **Current milestone:** M3 — full verification and delivery
- **Branch:** `fix/m71-admin-dashboard-load-errors`
- **Base:** M70 PR head `7f97061f3c13ee21a29864f05b2e6502dc38bf9a`
- **Worktree:** `/tmp/gridy-m71-admin-dashboard-load-errors`
- **Primary checkout:** Untouched

## Baseline evidence
- `Dashboard.tsx` uses `Promise.allSettled`; rejected results are ignored.
- An activities failure leaves `activities` empty, so `AppointmentsTable` displays its successful-empty message.
- A summary failure leaves `summaryData` null; `MetricCards` renders clearance revenue as `₱0.00`, while the charts render empty without an error state.
- Existing `Dashboard.test.tsx` covers successful loads and the DILG redirect only.

## Verification log
- **Existing baseline:** `npm --prefix frontend run test -- src/pages/admin/Dashboard.test.tsx` — PASS, 1 file and 2 tests. Existing coverage confirms successful metrics/activities and DILG redirect only.
- **Regression reproduction:** `npm --prefix frontend run test -- src/pages/admin/Dashboard.test.tsx src/components/admin-dashboard/AppointmentsTable.test.tsx` — expected red, 2 files; 4 tests failed and 3 passed. Both dashboard failure/retry cases had no alert, the table error case had no retryable alert, and its loading case showed no loading status. The true-empty table case passed.
- **Focused implementation:** `npm --prefix frontend run test -- src/pages/admin/Dashboard.test.tsx src/components/admin-dashboard/AppointmentsTable.test.tsx` — PASS, 2 files and 7 tests.
- **Coverage:** summary failure with no false `₱0.00`; activities remain visible; summary retry repeats failure, disables while pending, then recovers without refetching activities; activities failure hides the false-empty row, retains summary metrics, retries only activities, and recovers; table distinguishes loading, failed, and successful-empty states; no POST/PATCH/DELETE calls; DILG redirect still avoids barangay dashboard requests.
- **Full frontend tests:** `npm --prefix frontend run test` — PASS, 41 test files and 149 tests.
- **Lint:** `npm --prefix frontend run lint` — PASS, exit code 0 with no diagnostics.
- **Build:** `npm --prefix frontend run build` — PASS, TypeScript and Vite production build; 2,514 modules transformed.
- **Diff hygiene:** `git diff --check` — PASS with no output. The final self-review confirms the implementation changes are limited to the dashboard page, appointments table, and their focused tests; there are no backend, API, schema, dependency, or infrastructure changes. The M71 task packet has no trailing whitespace.

## Delivery
No M71 code commit, push, or PR yet. M70 PR #201 is open and unmerged. Azure pilot remains NO-GO.
