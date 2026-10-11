# Task Brief: M60 — Aid Request History Load Error State

## Metadata

- **Task ID:** `m60-aid-request-load-error-states`
- **Type:** Bug fix
- **Target:** Frontend citizen/staff aid request page
- **Implementer:** Codex (user-directed sole-agent mode)
- **Delivery branch:** `fix/m60-aid-request-load-error-states-delivery`
- **Base:** M59 delivery commit `f157770617edc67973ca8cd499ab80a4f0ba8b71`

## Goal and Scope

Show a clear, accessible retry state when the aid request list cannot be loaded, so a failed request is never presented as an empty history.

Scope is limited to `frontend/src/pages/citizen/AidRequests.tsx`, its existing test file, and this task packet. Reuse the existing `InlineErrorState` component.

Non-goals: API or payload changes; resident ownership or barangay scoping changes; RBAC, authentication, approval, rejection, submission, or payment changes; schema, dependencies, shared fetching architecture, other pages, or Azure changes.

## Evidence

- `AidRequests.loadRequests()` at `AidRequests.tsx:43-53` catches a failed GET only with a toast and sets `loading` false.
- The list branch at `AidRequests.tsx:161-168` then renders “No assistance requests have been submitted.” when `requests` remains empty. This conflates a server/network failure with a successful empty response for both residents and staff.
- Existing tests in `AidRequests.test.tsx` cover resident submission and staff decline validation, but not list-fetch failure or recovery.
- `InlineErrorState` already provides a screen-reader announced `role="alert"`, generic connection guidance, a keyboard-operable retry button, and a disabled pending state.

## Required Invariants

- Preserve the same `/aid-requests/` endpoint and existing resident/staff response handling.
- Retry is read-only and must not invoke POST submission or PATCH review actions.
- Keep the resident submission form available when its request history fails to load.
- Keep successful empty results as the existing empty state and existing populated-list actions unchanged.
- Display no raw exception details. Do not change server-side tenant or role enforcement.

## Acceptance Criteria

1. [x] A failed initial aid request fetch renders an accessible error and retry control, not the successful-empty message.
2. [x] Retrying calls the same GET endpoint; a second failure keeps the error retryable and a successful response renders records and clears the error.
3. [x] A successful empty response still renders “No assistance requests have been submitted.”
4. [x] The retry button is disabled while GET is pending and retrying does not call POST or PATCH.
5. [x] Resident submission form remains available during a list-load error; staff review controls and existing behavior remain unchanged after successful load.
6. [x] No API, schema, dependency, tenant/RBAC, or Azure changes are introduced.
7. [x] Focused tests, frontend lint, full frontend tests, production build, and diff hygiene pass and actual results are recorded in `STATUS.md`.

## Safety

- Work only in `/tmp/gridy-m60-aid-request-load-error-states`; preserve the primary checkout and its untracked assets.
- Tests use mocked API responses. No production endpoint or database access.
- Azure pilot remains NO-GO. The eventual PR stacks on M59 PR #190 and remains unmerged.
