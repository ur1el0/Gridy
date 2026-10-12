# Task Brief: M74 Live Queue Initial Load Recovery

## Metadata
- **Task ID:** `m74-live-queue-initial-load-state`
- **Task type:** Frontend bug fix
- **Target:** Staff Live Queue page
- **Branch:** `fix/m74-live-queue-load-state`
- **Base:** M73 PR #204 head `e9fcc89e81e2ad4e4bc7c84fee3bd7b79ea6ecf0`

## Goal
Keep an initial queue read failure distinct from a genuinely empty queue, and let staff retry the same read immediately.

## Scope and non-goals
- Preserve queue counts as unknown and suppress empty-list claims until at least one successful ticket fetch.
- Expose initial read errors through an accessible alert and a retry action.
- Preserve already-loaded tickets if a later automatic poll fails; continue polling every three seconds.
- Preserve the existing queue API, action handlers, audio announcements, roles, routes, and authorization.
- Do not change backend code, API contracts, schema, dependencies, infrastructure, or Azure settings. Azure pilot remains NO-GO.

## Current behavior and evidence
- `frontend/src/pages/services/LiveQueue.tsx` initializes `tickets` to `[]`; `fetchTickets()` catches a failed `GET /tickets/` and always sets `loading` to false. The page then passes an empty list and `loading={false}` to its views.
- `frontend/src/components/queue/QueueMetrics.tsx` renders numeric values when `loading` is false, so an initial failure appears as zero counts.
- `frontend/src/components/queue/WaitingListTable.tsx` renders “No … tickets currently waiting” for empty arrays, even when the first fetch failed.
- `frontend/src/components/queue/ActiveTicketView.tsx` displays “No resident currently being served” when no ticket is present, which also looks like a confirmed empty result before any request has succeeded.
- The page's error `<div>` has no alert role. Automatic polling retries every three seconds, and the waiting list has a refresh control, but neither prevents the false empty state on the first failure.
- Existing coverage in `frontend/src/pages/services/LiveQueue.test.tsx` exercises successful loading and polling, not an initial failed read or preservation of last-loaded data after a polling failure.

## Acceptance criteria
1. While the first `GET /tickets/` is pending or has failed, queue metrics remain unknown and no active-ticket or waiting-list view claims the queue is empty.
2. An initial read failure is announced as an accessible error and provides an immediate retry action for `GET /tickets/` only.
3. The retry control is disabled while its request is pending; a successful empty response then renders the real zero/empty state.
4. After one successful load, a failed background poll announces the failure while keeping the last successful ticket data visible.
5. Automatic polling remains at three seconds, and existing audio, queue actions, and successful populated behavior remain intact.
6. No backend, contract, schema, dependency, infrastructure, or Azure-pilot changes are included.

## Verification
- Focused tests: `npm --prefix frontend run test -- src/pages/services/LiveQueue.test.tsx`
- Full frontend tests: `npm --prefix frontend run test`
- Lint: `npm --prefix frontend run lint`
- Production build: `npm --prefix frontend run build`
- Diff hygiene: `git diff --check`
