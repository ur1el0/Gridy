# Implementation Plan: M64 — Announcements Load Error Recovery

## Overview
- **Brief:** `TASK_BRIEF.md`
- **Branch:** `fix/m64-announcements-load-error-states`
- **Base:** M63 delivery commit `82eda91e2eb115af725473b6d7f2886a7ccd3dc7`
- **Complexity:** Low

## Milestones

### M1 — Capture regression behavior
1. Add focused tests for initial GET failure, action availability, GET-only retry, repeated failure/recovery, genuine empty response, pending retry behavior, and retaining existing cards after a failed post-create GET.
2. Run the focused test file and confirm the old implementation fails the expected cases.
3. Record actual output in `STATUS.md`.

**Validation:** `npm --prefix frontend run test -- src/pages/services/Announcements.test.tsx`

### M2 — Add retryable list error UI
1. Track retry-pending state separately from initial loading.
2. Clear the list error after a successful list response.
3. Render `InlineErrorState` inside the announcements content region instead of returning a page-level error.
4. Keep header and the existing role-gated create control visible.
5. Leave mutations and other behavior unchanged; retry must only invoke `fetchAnnouncements(true)`.

**Validation:** Run the focused Announcements tests.

### M3 — Full verification and delivery
1. Run the full frontend tests, lint, production build, and `git diff --check`.
2. Review the final diff against this brief; confirm only the page, focused test, and M64 task documents changed.
3. Confirm no staged or unrelated files; commit the milestone, push the branch, and open a PR stacked on M63 PR #194 without merging.
4. Record exact commit, push, PR, hosted check results, and any verification limitations in `STATUS.md`.

## Risks and controls
- **False empty state after failure:** Suppress the empty message whenever the list error is present.
- **Losing known records:** Do not clear or replace announcements in the catch path.
- **Accidental mutation on retry:** Test that only GET calls occur while retrying.
- **Behavior drift:** Keep create/delete/share handlers, image logic, API path, and response normalization unchanged.
- **Delivery network unavailable:** Complete and validate locally, preserve the branch and exact commands, then retry push/PR creation when GitHub access returns.
