# Task Brief: M70 Push Alert Preference Payload

## Metadata
- **Task ID:** `m70-push-alert-preference-payload`
- **Task type:** Bug fix
- **Target:** Frontend settings page
- **Branch:** `fix/m70-push-alert-preference-payload`
- **Base:** M69 PR head `c1745472cbdaae788f546600c7645beec0d19297`

## Goal and scope
Make the push notification toggle persist the value the user selected. `Settings.handleTogglePush` currently computes `newValue` but sends the old `pushAlerts` value in the PATCH body.

In scope:
- Cover both false-to-true and true-to-false payloads in `Settings.test.tsx`.
- Keep the local toggle state synchronized only after a successful PATCH.
- Change only the push preference handler and focused frontend tests, plus this task packet.

Out of scope:
- Email preference behavior, API/backend changes, other settings, schema, dependencies, infrastructure, and Azure pilot work.

## Acceptance criteria
1. Toggling push alerts from false to true sends `PATCH /auth/me/` with `{ push_alerts: true }`.
2. Toggling from true to false sends `{ push_alerts: false }`.
3. UI state changes after a successful PATCH and remains unchanged while the request is pending or fails.
4. No backend, database, dependency, or infrastructure changes are introduced.

## Verification
- Red/green focused regression: `npm --prefix frontend run test -- src/pages/admin/Settings.test.tsx`
- Full frontend tests: `npm --prefix frontend run test`
- Lint: `npm --prefix frontend run lint`
- Production build: `npm --prefix frontend run build`
- Diff hygiene: `git diff --check`
