# Task Brief: M61 — Hotline Management Load Error State

## Metadata

- **Task ID:** `m61-hotline-load-error-states`
- **Task type:** Bug fix
- **Target:** Frontend hotline management page
- **Implementer / reviewer:** Codex (user-directed sole-agent mode)
- **Delivery branch:** `fix/m61-hotline-load-error-states-delivery`
- **Base:** M60 delivery commit `2a2f2e06ddd5566c364c435d4bef55462aa480e7` (PR #191)

## Goal and Scope

Show an accessible retryable error when the hotline list request fails so the page does not report a failed load as a successful empty list.

Scope is limited to `frontend/src/pages/admin/HotlineManagement.tsx`, a focused Vitest file, and this task packet. Reuse the shared `InlineErrorState` component.

**Non-goals:** No API, payload, permissions, tenant scoping, add/delete behavior, schema, dependency, shared fetching architecture, other page, Azure, or production changes.

## Current Behavior and Evidence

- `HotlineManagement.fetchHotlines()` calls `GET /hotlines/`; its catch handler only displays a toast and its `finally` block clears `loading`.
- `hotlines` remains an empty array after a failed request, so the page renders “No hotlines added yet.” as if the request succeeded.
- The initial loading return also hides the page header and Add Hotline action until the first request settles.
- `frontend/src/components/ui/InlineErrorState.tsx` already provides a generic accessible alert and a disabled-while-pending retry action. The `AidRequests` and resident management pages demonstrate the project's retry pattern.
- No `HotlineManagement` page test currently covers load failure or recovery.

## Required Invariants

- Keep `GET /hotlines/` and existing response normalization (`data.results || data`).
- Retry performs only the same GET; it does not invoke POST or DELETE.
- Keep the header and Add Hotline action available after load failure, and preserve the existing add/delete flows.
- Successful empty and populated responses retain their existing UI behavior.
- Do not display raw exception details or change API, authorization, or tenant behavior.

## Acceptance Criteria

1. A failed initial GET displays an accessible error and retry action instead of “No hotlines added yet.”
2. Retrying uses `GET /hotlines/`; repeated failures remain retryable, and successful recovery clears the alert and renders the returned rows.
3. A successful empty response still displays “No hotlines added yet.”
4. Retry is disabled while the GET is pending, invokes no POST/DELETE, and the Add Hotline action remains available after load failure.
5. Existing populated list, add, and delete behavior is unchanged.
6. No backend/API, schema/migration, dependency, tenant/RBAC, or Azure changes are introduced.
7. Focused and full frontend tests, lint, production build, and diff hygiene are run and actual results recorded in `STATUS.md`.

## Safety

- Work only in `/tmp/gridy-m61-hotline-load-error-states`; leave the primary checkout and untracked environment/brand assets untouched.
- Tests use mocked API calls only. Azure pilot remains NO-GO. Do not access production services or data.
- Stack the final PR on M60 PR #191's branch while that PR remains open; do not merge either PR.
