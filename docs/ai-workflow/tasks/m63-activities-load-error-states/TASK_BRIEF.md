# Task Brief: M63 — Activities Load Error Recovery

## Metadata

- **Task ID:** `m63-activities-load-error-states`
- **Type:** Frontend bug fix
- **Target:** `frontend/src/pages/services/Activities.tsx`
- **Branch stack:** M62 PR #193 (`fix/m62-notification-load-error-states-delivery`)
- **Writer/reviewer:** Codex, user-directed sole-agent mode

## Goal

Make failed Activities list requests accessible and retryable while keeping the Schedule Activity action usable and preserving previously loaded records after a failed follow-up read.

## Current behavior and evidence

`Activities.fetchActivities()` catches GET failures and sets an error string. The page-level error return hides the page header and Schedule Activity control and has no accessible alert or retry. The same loader runs after successful activity creation, so a failed follow-up GET also replaces already-loaded cards with the plain error page. The project already provides `InlineErrorState` for accessible retry UI.

## Non-goals

- Do not change the `/activities/` API contract, backend, tenant scope, RBAC, data model, or migrations.
- Do not change create/delete behavior, event validation, time conversion, or modal contents.
- Do not add dependencies, queue infrastructure, or cloud configuration.
- Do not change the Announcements or Issue Reports pages in this milestone.

## Rules

- Retry the existing list GET only; no create/delete mutation may be caused by a retry.
- Preserve successful empty and populated states.
- Keep the page header and Schedule Activity action visible and usable during list failure and retry.
- If a later list read fails after records were loaded, preserve those known records while showing the retryable error.
- Do not expose exception details; use the existing `InlineErrorState`.

## Acceptance criteria

1. A failed initial list GET displays an accessible retryable error and does not display the successful-empty message.
2. The page header and Schedule Activity action remain usable after the failure.
3. Retry calls only `GET /activities/`; repeated failure remains visible; eventual success clears the error and shows data or the genuine empty state.
4. If the follow-up GET after successful activity creation fails, previously loaded activity cards remain visible beside the retryable error.
5. The retry control is disabled with its pending label while the GET is pending.
6. Existing creation, deletion, API path, response normalization, and successful rendering remain unchanged.
7. No backend/API contract, database/schema, dependency, tenant/RBAC, or infrastructure changes are introduced.
8. Focused and full frontend checks pass; actual results and limitations are recorded in `STATUS.md`.
