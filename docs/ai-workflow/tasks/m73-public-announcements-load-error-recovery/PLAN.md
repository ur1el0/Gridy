# Plan: M73 Public Announcements Load Error Recovery

## Milestone 1 — Reproduce the missing retry
1. Add page tests for a failed initial GET, retry URL and GET-only behavior, pending retry, repeated failure and recovery, and a successful empty response.
2. Retain populated-response coverage and assert public page context stays visible.
3. Run the focused test file against the current page and record the expected failures.

## Milestone 2 — Add public read recovery
1. Extract the existing request into a stable callback suitable for initial load and retry.
2. Track loading, failure, and retrying independently; use the existing accessible `InlineErrorState` for failed reads.
3. Preserve the heading, public guidance, footer, empty state, populated presentation, and barangay-specific URL.
4. Keep retries limited to `GET /public/barangays/:barangayId/announcements/`.

## Milestone 3 — Verify and deliver
1. Run focused tests, the full frontend suite, Oxlint, the TypeScript/Vite production build, and `git diff --check`.
2. Review the final diff for the public page, its tests, and this M73 task packet only.
3. Record actual verification and delivery details in `STATUS.md`.
4. Commit and push the branch, then open a PR based on M72 PR #203 without merging. Do not deploy; Azure pilot remains NO-GO.

## Risks and controls
- A failed public GET must never appear as a successful empty bulletin.
- Keep retry bound to the current `barangayId` and avoid changing the route or API access policy.
- Preserve all current public page copy and transaction sign-in navigation.
- Leave backend, authorization, schema, dependencies, infrastructure, and Azure configuration unchanged.
