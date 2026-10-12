# Status: M74 Live Queue Initial Load Recovery

## Summary
- Task ID: m74-live-queue-initial-load-state
- State: PR opened; hosted checks are pending.
- Branch: fix/m74-live-queue-load-state
- Base: M73 PR #204 head e9fcc89e81e2ad4e4bc7c84fee3bd7b79ea6ecf0.
- Worktree: isolated at `/tmp/kapitbayan-local-m73`; primary checkout preserved.
- Azure pilot: NO-GO.

## Progress
- [x] Review M71/M72 cloud PR stack and M73 PR #204; M73 remains open and unmerged.
- [x] Identify the false empty-state behavior in LiveQueue after a failed initial GET.
- [x] Create the M74 task brief and plan.
- [x] Add failing tests for initial failure and background poll failure.
- [x] Implement truthful initial loading/error states and retry.
- [x] Run required frontend checks and self-review the diff.
- [x] Commit, push, and open a stacked PR; do not merge or deploy.

## Baseline evidence
- `LiveQueue.fetchTickets()` sets an error on failure and sets `loading` false in `finally`, while `tickets` stays at its initial empty array.
- `QueueMetrics` then displays zero values, and `WaitingListTable` shows its empty lanes even though no successful queue response was received.
- `ActiveTicketView` also renders the ordinary no-current-ticket text for the default empty array. The plan now withholds all three data presentations until the first successful read.
- The error container is not currently a live alert. The page does have automatic three-second polling and an existing waiting-list refresh control.
- M73 cloud context: PR #204 is open/mergeable and stacked on M72 PR #203. Hosted run 514 was still running at the time M74 began; Azure remains NO-GO.
- Cloud recheck before M74 delivery: PR #204 remains open, unmerged, and mergeable; GitHub Actions run 514 completed successfully, and the Vercel status check is successful. No M74 branch exists on origin yet.

## Verification log
| Phase | Command | Result |
| --- | --- | --- |
| Baseline regression | `npm --prefix frontend run test -- src/pages/services/LiveQueue.test.tsx` | Expected red: 12 tests total, 10 passed and 2 failed. The initial failure and background poll failure both lacked `role=alert`; the initial render also showed empty queue lanes and metrics based on the zero-ticket default. |
| Focused verification | `npm --prefix frontend run test -- src/pages/services/LiveQueue.test.tsx` | PASS: 1 test file, 12 tests passed (1.64s). |
| Full frontend suite | `npm --prefix frontend run test` | PASS: 41 test files, 159 tests passed (11.44s). |
| Oxlint | `npm --prefix frontend run lint` | PASS: exit code 0, no diagnostics. |
| Production build | `npm --prefix frontend run build` | PASS: TypeScript and Vite build; 2,514 modules transformed (1.20s). |
| Diff hygiene | `git diff --check` | PASS after removing one trailing space reported by the first check; final check is clean. |

## Implementation notes
- `hasLoadedQueue` now separates never-loaded data from a valid empty response. Before the first successful GET, the page shows loading or the shared accessible retry state, keeps metric values unknown, and withholds the active-ticket and empty waiting-list presentations.
- A successful empty response unlocks the genuine zero counts and empty lanes. Later polling failures use `role="alert"` while retaining the last successful ticket snapshot; a subsequent successful poll clears the alert.
- Retry uses only the existing `GET /tickets/` endpoint. The three-second poll interval, action endpoints, role checks, and audio transition logic remain unchanged.

## Delivery
- Implementation commit: `cc2d9fe655c2320287140b760530a652896215e6` (`fix(queue): distinguish initial load failure from empty queue`).
- Branch pushed to `origin/fix/m74-live-queue-load-state`.
- Pull request: [#205](https://github.com/ur1el0/KapitBayan/pull/205), based on M73 PR #204 branch `fix/m73-public-announcements-load-errors`.
- Cloud recheck after the delivery note push: PR #205 remains open, unmerged, and mergeable. GitHub Actions run 518 is in progress; Vercel is pending. In run 516, frontend tests and Oxlint passed, mobile analysis passed, Azure preflight and Bicep passed, while the frontend build, mobile tests, and remaining integration jobs were still running. This is a point-in-time record; no merge or deployment was performed.
- No merge or deployment was performed. Azure pilot remains NO-GO.
