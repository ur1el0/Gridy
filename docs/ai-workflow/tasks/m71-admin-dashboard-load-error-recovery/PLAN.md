# Plan: M71 Admin Dashboard Load Error Recovery

## Milestone 1 — Reproduce both false-empty failure states
1. Add page tests for summary and activities GET failures, independent retry/recovery, preserved known data, pending retry behavior, true empty response, and no writes.
2. Add an `AppointmentsTable` test for displaying the read error instead of its success-empty row.
3. Run the focused tests against current code and record the expected failures.

## Milestone 2 — Add independent read recovery
1. Track loading, failure, and retry state separately for dashboard summary and activities.
2. Preserve fulfilled data if the other GET fails or a retry later fails.
3. Show an accessible `InlineErrorState` for a failed summary; avoid rendering failed summary metrics/charts as valid values.
4. Extend `AppointmentsTable` with loading and error rows; suppress its success-empty row until a successful response, while retaining any activities already present alongside an error.
5. Keep each retry scoped to its own GET and retain request cancellation on unmount.
6. Preserve DILG role redirection and all successful response shapes.

## Milestone 3 — Verification and delivery
1. Run focused and full frontend tests, lint, production build, and `git diff --check`.
2. Review the diff for strict scope: dashboard page, appointments table, focused tests, and M71 task packet only.
3. Commit, push, and open a PR stacked on M70 PR #201 without merging; record hosted checks in `STATUS.md`.

## Risks and controls
- Keep the two reads independent so one successful section is not hidden by the other failure.
- Do not treat rejected reads as zero-count business data.
- Retry only the selected GET; tests must assert unrelated GETs are not refetched and no mutation method is called.
- Do not change API response shapes, role boundaries, or infrastructure. Azure pilot remains NO-GO.
