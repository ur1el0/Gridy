# Task Brief: M73 Public Announcements Load Error Recovery

## Metadata
- **Task ID:** `m73-public-announcements-load-error-recovery`
- **Task type:** Frontend bug fix
- **Target:** Public barangay announcements page
- **Branch:** `fix/m73-public-announcements-load-errors`
- **Base:** M72 PR #203 head `cbda5d6f3c0075032e50020682604ea0ee678bc2`

## Selection evidence
The cloud M72 implementation and PR were reviewed before local work. PR #203 remains open on PR #202; its application-code tests passed, and the latest cloud change is documentation-only. The next observed frontend gap is `frontend/src/pages/public/PublicAnnouncements.tsx`: a rejected `GET /public/barangays/:barangayId/announcements/` shows a failure alert but gives public visitors no retry. Its existing test covers only a successful populated response. M64 addresses the authenticated staff announcements page, not this separate public route.

## Goal
Let visitors retry a failed public announcements read without losing the page context, while keeping a failed response distinct from a successful empty response.

## Scope and non-goals
- Add an accessible retry action for the existing public announcements GET.
- Keep the public page heading, explanatory guidance, and sign-in footer visible during initial loading, failure, and retry.
- Preserve the successful populated and empty states and the barangay-specific request URL.
- Retry only the read request; do not add mutations.
- Do not change backend/API behavior, public access policy, routes, schema, dependencies, infrastructure, or Azure configuration. Azure pilot remains NO-GO.

## Acceptance criteria
1. Initial loading is announced and the page does not show the successful-empty state before the request completes.
2. A failed GET shows an accessible error and retry control, not the successful-empty message.
3. Retry calls only the same barangay-specific GET, disables while pending, keeps repeated failures retryable, and clears the error on successful populated or empty data.
4. The page heading, explanatory guidance, and sign-in footer remain present through loading, failure, and retry.
5. Successful populated announcements and a successful empty response retain their existing presentation.
6. No backend, API contract, route, schema, dependency, infrastructure, or Azure-pilot changes are included.

## Test seam
Exercise the rendered public route through its accessible UI and mock only the `axiosPublic` HTTP boundary. Verify the URL retains the route's barangay ID and retry produces no non-GET request.

## Verification
- Focused tests: `npm --prefix frontend run test -- src/pages/public/PublicAnnouncements.test.tsx`
- Full frontend tests: `npm --prefix frontend run test`
- Lint: `npm --prefix frontend run lint`
- Production build: `npm --prefix frontend run build`
- Diff hygiene: `git diff --check`
