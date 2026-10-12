# Task Brief: M64 — Announcements Load Error Recovery

## Metadata
- **Task ID:** `m64-announcements-load-error-states`
- **Type:** Frontend bug fix
- **Target:** `frontend/src/pages/services/Announcements.tsx` and focused tests
- **Branch:** `fix/m64-announcements-load-error-states`, based on M63 delivery `82eda91`
- **Lead / implementer / reviewer:** Codex (user-directed sole-agent mode)

## Goal
Make failed Announcements list reads accessible and retryable without hiding page actions or discarding previously loaded announcements.

## Current behavior and evidence
`Announcements.fetchAnnouncements()` stores an error on GET failure, but the component returns a plain error block that replaces the entire page. The initial fetch and post-create refresh both use this loader. There is no retry control; a failure after records have loaded hides those records.

## Scope
- Keep list request at `GET /announcements/`.
- Use the existing accessible `InlineErrorState` component for retry UI.
- Keep page heading/content and the ADMIN New Announcement action available during initial-load failure and retry.
- Preserve already loaded cards if a subsequent list read fails.
- Keep the successful empty state distinct from a failed read.
- Keep retry limited to the list GET.

## Non-goals
- No API, backend, serializer, tenant/RBAC, database, migration, dependency, infrastructure, or branding changes.
- Do not change create/delete/share semantics, announcement form fields, image handling, response normalization, or API paths.
- Do not change other pages in this task.

## Required rules
- Do not expose exception details in user-facing messages.
- A retry must not issue POST, PATCH, or DELETE requests.
- Existing authorization behavior remains: the New Announcement action is shown only to ADMIN users.

## Acceptance criteria
1. A failed initial GET shows an accessible alert with retry and does not show “No announcements active right now.”
2. The page and existing ADMIN create action remain available after load failure.
3. Retry calls only `GET /announcements/`; repeated failures remain visible, and a successful retry clears the alert and renders data or the genuine empty state.
4. If the refresh GET after a successful create fails, previously loaded announcement cards remain visible with the retry alert; existing create success/modal-close behavior remains intact.
5. While retry is pending, its button is disabled and no mutation request is made.
6. Successful populated and empty responses, create/delete/share behavior, image upload behavior, and response normalization remain unchanged.
7. No backend, API contract, schema, dependency, RBAC, or infrastructure changes are included.
8. Focused and full frontend tests, lint, production build, and diff hygiene are run and recorded with actual results.

## Verification
- `npm --prefix frontend run test -- src/pages/services/Announcements.test.tsx`
- `npm --prefix frontend run test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `git diff --check`
