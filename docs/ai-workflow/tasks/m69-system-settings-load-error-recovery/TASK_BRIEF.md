# Task Brief: M69 — System Settings Load Error Recovery

## Metadata
- **Task ID:** `m69-system-settings-load-error-recovery`
- **Type:** Frontend bug fix
- **Target:** `frontend/src/pages/admin/Settings.tsx` and a focused test file
- **Branch:** `fix/m69-system-settings-load-error-recovery`
- **Base:** M68 delivery head `3eec74b`
- **Implementer / reviewer:** Codex (user-directed sole-agent mode)

## Objective and scope
Give the profile-preference and active-session sections independent, accessible retry states so failed requests cannot be mistaken for defaults or empty session results.

### Current behavior and evidence
- `GET /auth/me/` failure only logs to the console, then enables preference controls initialized to defaults (`emailAlerts=true`, `pushAlerts=false`). A user can interact with values that were never loaded.
- `GET /auth/sessions/` failure only logs to the console, then leaves `sessions=[]` and displays “No active sessions found.”
- The component already has independent loading indicators, and the two GET requests are independent.
- Evidence: `frontend/src/pages/admin/Settings.tsx`, initial state and fetch functions near lines 16–72; profile controls near lines 86–120; session list near lines 160–193. No `Settings.test.tsx` currently exists.

## Required behavior
1. Profile-preference load failure displays a retryable accessible error in the Notifications section and suppresses the default-valued controls until the GET succeeds.
2. Session-list load failure displays its own retryable accessible error and never displays the empty-session claim for a failed request.
3. Retry of either section issues only that section’s existing GET. A retry in one section must not hide or refetch the other section.
4. Retry controls are disabled while their request is pending. Repeated failures remain visible; success clears only that section’s error and renders the returned data.
5. Change Password remains available if either GET fails. Existing successful preference and session behaviors remain otherwise unchanged.

## Non-goals and constraints
- No backend/API, tenant/RBAC, schema, dependency, infrastructure, payment, password-change, or unrelated-page changes.
- Do not change preference PATCH or session DELETE behavior in this milestone.
- No production actions. Azure pilot remains NO-GO.

## Verification
- `npm --prefix frontend run test -- src/pages/admin/Settings.test.tsx`
- `npm --prefix frontend run test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `git diff --check`

## Known follow-up
Read-only inspection found `handleTogglePush` currently sends the previous `pushAlerts` value in its PATCH payload rather than `newValue`. Keep that separate from this load-error task and track it for a focused follow-up after M69.
