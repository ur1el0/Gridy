# Task Brief: M66 — Document Requests Load Error Recovery

## Metadata
- **Task ID:** `m66-document-requests-load-error-states`
- **Type:** Frontend bug fix
- **Target:** `frontend/src/pages/services/DocumentRequests.tsx`, `frontend/src/components/documents/DocumentTable.tsx`, and focused tests
- **Branch:** `fix/m66-document-requests-load-error-states`, based on M65 delivery head `7a5b68e`
- **Lead / implementer / reviewer:** Codex (user-directed sole-agent mode)

## Goal
Make failed Document Requests list reads accessible and retryable while keeping walk-in controls visible and preserving already loaded rows after failed refreshes.

## Current behavior and evidence
`fetchRequests()` catches a failed `GET /document-requests/` and sets a generic error. The component then returns that plain error instead of the page, hiding the Clearance Desk heading, walk-in action, request table, and any retry path. The same loader runs after a successful walk-in POST; if its follow-up GET fails, the loaded table is hidden even though the loader preserves its request array.

## Scope
- Keep the existing `GET /document-requests/` endpoint and response normalization.
- Extend `DocumentTable` with an optional load-error presentation prop because that component owns the current successful-empty row.
- Use the existing accessible `InlineErrorState`.
- Keep the page heading and Request Walk-in action visible after a failed GET and while retrying.
- Keep an error distinct from the successful empty table state.
- Preserve loaded rows when a later GET fails, including the post-create refresh.
- Retry must call only the existing list GET.
- Preserve the current initial loading and post-create submit/modal-close behavior.

## Non-goals
- No changes to API/backend behavior, serializers, tenant scope, RBAC, database, migrations, dependencies, or infrastructure.
- Do not otherwise restructure or redesign `DocumentTable`.
- Do not change create/delete, status/payment review, PDF download, fee calculations, detail modal, or table behavior.
- Do not change API paths or response normalization.
- Do not modify other pages.

## Required rules
- Keep user-facing error messages generic.
- A retry must not issue POST, PATCH, DELETE, or PDF-generation requests.
- A successful walk-in POST keeps its current success feedback and modal reset/close behavior even if the subsequent list GET fails.

## Acceptance criteria
1. A failed initial `GET /document-requests/` shows an accessible alert and does not display “No clearance requests recorded yet.”
2. The Clearance Desk heading, Request Walk-in action, and request table headers remain visible after failure and during retry.
3. Retry calls only `GET /document-requests/`; repeated failure remains visible; successful recovery clears the alert and renders returned rows or the genuine empty state.
4. If the post-create list GET fails after a successful walk-in POST, previously loaded rows remain visible beside the retry alert and the existing modal close/reset behavior remains intact.
5. The retry button is disabled while the GET is pending; no mutation occurs from retry.
6. Existing initial loading, create/delete/status/payment/PDF flows, fee rules, response normalization, and API contract remain unchanged.
7. No backend/API, schema, dependency, tenant/RBAC, or infrastructure changes are introduced.
8. Focused and full frontend tests, lint, production build, and diff hygiene are run and recorded with actual results.

## Verification
- `npm --prefix frontend run test -- src/pages/services/DocumentRequests.test.tsx src/components/documents/DocumentTable.test.tsx`
- `npm --prefix frontend run test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `git diff --check`
