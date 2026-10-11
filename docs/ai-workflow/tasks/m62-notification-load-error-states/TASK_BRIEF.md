# Task Brief: M62 — Notifications Load Error State

## Metadata

- **Task ID:** `m62-notification-load-error-states`
- **Type:** Frontend bug fix
- **Branch stack:** M61 PR #192 (`fix/m61-hotline-load-error-states-delivery`)
- **Writer/reviewer:** Codex, user-directed sole-agent mode

## Goal

Make the admin Notifications Center distinguish a failed initial `/admin-notifications/` request from a successful response with no notifications, and let the user retry the same read request.

## Current behavior

`frontend/src/pages/community/Notifications.tsx` logs and toasts when the list GET fails, then clears `loading` while `notifications` remains empty. The page consequently renders “You're all caught up!” and “There are no new notifications at this time.” A transient server or network failure is presented as valid empty data. No in-page retry is available.

## Non-goals

- Do not change API endpoints, response contracts, backend behavior, authentication, authorization, tenant scope, or notification mutations.
- Do not change mark-as-read, delete, selection, pagination, schema, dependencies, infrastructure, or Azure configuration.
- Do not expose exception details or notification content in the error state.

## Rules

- Preserve the existing notification list and action behavior after successful responses.
- Retry only the list GET; it must not invoke mark-read or delete endpoints.
- Keep the page heading and existing action controls available; mutation controls remain disabled while there are no loaded notifications.
- Keep successful empty responses distinct from failed requests and use the existing accessible `InlineErrorState` component.

## Acceptance criteria

1. A failed initial GET displays an accessible retryable error and does not display the successful-empty state.
2. Retry calls `/admin-notifications/` again; repeated failure keeps the error visible; eventual success clears it and displays either loaded notifications or the genuine empty state.
3. The retry button disables while the GET is pending and exposes its pending label.
4. Retrying does not call POST, PATCH, or DELETE notification endpoints.
5. Existing successful list and action behavior is unchanged.
6. No API, backend, schema, dependency, tenant/RBAC, or infrastructure changes are introduced.
7. Focused and full frontend checks pass; actual results and any limitations are recorded in `STATUS.md`.
