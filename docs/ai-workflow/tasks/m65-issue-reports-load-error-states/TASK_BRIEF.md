# Task Brief: M65 — Issue Reports Load Error Recovery

## Metadata
- **Task ID:** `m65-issue-reports-load-error-states`
- **Type:** Frontend bug fix
- **Target:** `frontend/src/pages/services/IssueReports.tsx` and focused tests
- **Branch:** `fix/m65-issue-reports-load-error-states`, based on M64 PR head `134a307`
- **Lead / implementer / reviewer:** Codex (user-directed sole-agent mode)

## Goal
Make Issue Reports list load failures accessible and retryable while keeping the page context visible and distinguishing failed reads from a successful empty result.

## Current behavior and evidence
The mount-time `GET /reports/` loader catches errors and stores “Failed to load issue reports.” The component then returns that plain text before rendering the page title and report table. There is no retry. The existing shared `InlineErrorState` provides an accessible alert and retry control.

## Scope
- Keep the list API at `GET /reports/`.
- Use the existing `InlineErrorState`.
- Keep the Issue Reports heading and table context available when the request fails and while retrying.
- Show the empty table row only after a successful empty response.
- Make retry repeat only the list GET.

## Non-goals
- No changes to backend/API behavior, tenant scope, RBAC, database, migrations, dependencies, or infrastructure.
- Do not change report status updates, detail drawer, image lightbox, table columns, request/response normalization, or API path.
- Do not add periodic polling or a manual refresh feature.
- Do not modify other pages.

## Required rules
- Keep user-facing errors generic; do not expose exception details.
- A retry must not issue `PATCH` or any other mutation.
- Preserve the existing status-update permission and request behavior.

## Acceptance criteria
1. A failed initial `GET /reports/` renders an accessible retry alert while keeping the Issue Reports heading and table headings visible.
2. A failed request never shows “No issue reports found.” as though the load succeeded.
3. Retry calls only `GET /reports/`; a repeated failure remains visible, and a successful retry clears the alert and displays returned rows.
4. A successful empty response displays the existing “No issue reports found.” row.
5. While retry is pending, the retry button is disabled and no `PATCH` request occurs.
6. Existing status updates, report detail behavior, table structure, and API contract remain unchanged.
7. No schema, dependency, tenant/RBAC, backend, or infrastructure changes are introduced.
8. Focused and full frontend tests, lint, production build, and diff hygiene are run and recorded with actual results.

## Verification
- `npm --prefix frontend run test -- src/pages/services/IssueReports.test.tsx`
- `npm --prefix frontend run test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `git diff --check`
