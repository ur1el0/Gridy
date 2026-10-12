# Plan: M74 Live Queue Initial Load Recovery

## Milestone 1 — Reproduce false empty queue on initial failure
1. Add rendered-page tests for a failed first queue GET, unknown metrics, hidden active-ticket and waiting-list empty claims, accessible retry, pending retry, and successful empty recovery.
2. Add coverage proving a failed background poll preserves the last successful ticket list.
3. Run the focused LiveQueue test file and record the expected failures.

## Milestone 2 — Keep queue data state truthful
1. Track whether at least one ticket request has succeeded.
2. Until that success, keep metrics unknown and withhold the active-ticket and waiting-list empty presentations; show loading or an accessible retry state instead.
3. Give failed reads alert semantics and support an immediate retry of the same GET; retain three-second automatic polling.
4. After a successful load, keep last-known tickets visible when a later poll fails and clear the alert on recovery.
5. Preserve current actions, role gates, queue audio behavior, routes, and API calls; `ActiveTicketView` and `WaitingListTable` do not need structural changes.

## Milestone 3 — Verify and deliver
1. Run focused tests, the full frontend suite, Oxlint, the TypeScript/Vite production build, and `git diff --check`.
2. Review the final diff for the LiveQueue page, queue presentation as needed, tests, and this task packet only.
3. Record actual checks and delivery details in `STATUS.md`.
4. Commit, push, and open a PR based on M73 PR #204 without merging. Do not deploy; Azure pilot remains NO-GO.

## Risks and controls
- A failed initial read must never be presented as a successful empty queue.
- A poll failure after successful data must not discard or replace the last-known queue snapshot.
- Retry remains a GET to `/tickets/`; no queue mutations are added.
- Keep the existing polling interval and ticket announcement transition detection unchanged.
