# Plan: M72 Barangay Applications Load Error Recovery

## Milestone 1 — Reproduce the false-empty failure
1. Add focused page tests for a rejected initial list GET, retry-only behavior, a retry pending state, repeated failure followed by recovery, and a successful empty result.
2. Retain a populated-list and review-flow regression so the load-state changes do not alter approval/rejection behavior.
3. Run the focused test file against current code and record the expected failures.

## Milestone 2 — Add list-read recovery
1. Track list loading/retry state independently from validation and review-mutation messages.
2. Render the existing `InlineErrorState` for a failed list read; suppress the successful-empty state until a successful response.
3. Keep page heading and verification guidance visible while loading, failing, and retrying.
4. Retry only `GET /auth/barangay-applications/`; preserve successful populated and empty responses and leave review POST behavior unchanged.

## Milestone 3 — Verify and deliver
1. Run the focused regression, full frontend tests, Oxlint, TypeScript/Vite production build, and `git diff --check`.
2. Review the diff for strict scope: the Barangay Applications page, focused page tests, and M72 task records only.
3. Update `STATUS.md` with actual local results, exact commits, branch base, PR link, and hosted CI outcome.
4. Commit and push the new branch, then open a PR based on M71 PR #202 without merging. Do not deploy; Azure pilot remains NO-GO.

## Risks and controls
- A failed GET must not be presented as an empty queue of applications.
- Keep list-read failures distinct from validation and review-mutation errors so a review failure cannot accidentally invoke the list retry UI.
- Retrying the list must never repeat an approval/rejection POST or create a tenant/account.
- Leave authentication, permissions, backend/API behavior, and Azure configuration unchanged.
