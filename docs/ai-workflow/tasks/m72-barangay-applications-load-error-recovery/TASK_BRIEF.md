# Task Brief: M72 Barangay Applications Load Error Recovery

## Metadata
- **Task ID:** `m72-barangay-applications-load-error-recovery`
- **Task type:** Frontend bug fix
- **Target:** DILG Barangay Applications list read
- **Branch:** `fix/m72-barangay-applications-load-errors`
- **Base:** M71 PR head `b84b4a7e9579a3f193245952335955052aef8406`

## Selection evidence
The current master backlog has no active application item: React Query remains parked until measurement shows a bottleneck, and DRF throttling is already covered natively. M71 is complete and open as PR #202. The next concrete defect found in the DILG onboarding workflow is in `frontend/src/pages/admin/BarangayApplications.tsx`: a rejected `GET /auth/barangay-applications/` sets an alert, but the page also renders “No applications have been submitted.” and offers no retry. Its existing test covers approval only, not read failure or a genuinely empty result.

## Goal
Distinguish a failed applications-list read from a successful empty response, and let DILG staff retry that GET without losing page context or triggering an application review mutation.

## Scope and non-goals
- Add accessible load-error and retry handling for `GET /auth/barangay-applications/`.
- Keep the heading and verification guidance visible while loading, after a failed read, and during retry.
- Preserve the successful empty state and all existing approval/rejection behavior, including approval confirmation, the rejection-note requirement, and POST payloads.
- Keep load errors separate from validation and review-mutation errors.
- Do not change backend/API behavior, account or tenant creation, permissions, schema, dependencies, infrastructure, or Azure configuration. Azure pilot remains NO-GO.

## Acceptance criteria
1. Initial loading is distinguishable from a completed read; a failed GET shows an accessible retry control and never shows the successful-empty message.
2. Retry calls only `GET /auth/barangay-applications/`, disables the retry control while pending, keeps repeated failure visible, and clears the load error after a successful populated or empty response.
3. A successful empty response shows “No applications have been submitted.”; a populated response continues to show its applications.
4. Page heading and DILG verification guidance remain visible through loading, failure, and retry.
5. Read retries do not send review POSTs. Approval confirmation, rejection-note validation, and review POST behavior remain unchanged.
6. No backend, API contract, dependency, schema, infrastructure, or Azure-pilot changes are included.

## Test seam
Exercise the rendered page through its public UI and mock only the external `axiosPrivate` HTTP boundary. Assert accessible loading/error/empty/populated states and that the retry action uses the existing list GET without issuing a review POST.

## Verification
- Red/green focused regression: `npm --prefix frontend run test -- src/pages/admin/BarangayApplications.test.tsx`
- Full frontend tests: `npm --prefix frontend run test`
- Lint: `npm --prefix frontend run lint`
- Production build: `npm --prefix frontend run build`
- Diff hygiene: `git diff --check`
