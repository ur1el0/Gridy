# Implementation Plan: M69 — System Settings Load Error Recovery

## Overview
- **Brief:** `TASK_BRIEF.md`
- **Branch:** `fix/m69-system-settings-load-error-recovery`
- **Base:** M68 delivery head `3eec74b`
- **Complexity:** Medium
- **PR plan:** Stack on M68 PR #199; open, do not merge.

## Milestones

### M1 — Regression coverage
1. Add `Settings.test.tsx` tests for independent profile and session load failures.
2. Verify failed profile loading does not expose default-valued preference controls, while the session section and Change Password remain usable.
3. Verify failed session loading does not show “No active sessions found,” while preferences and Change Password remain usable.
4. Cover pending retries, repeated failures, successful recovery, isolated GET calls, and absence of PATCH/DELETE during retry.
5. Run the new tests against unchanged source and record actual red results.

**Validation:**
```bash
npm --prefix frontend run test -- src/pages/admin/Settings.test.tsx
```

### M2 — Independent load recovery
1. Add separate error/retrying state and stable fetch callbacks for profile preferences and active sessions.
2. Reuse `InlineErrorState` inside the corresponding section.
3. Suppress profile controls until preferences load successfully; suppress empty-session text while session data is unavailable.
4. Retry only the failed section's GET; preserve independent content and existing successful mutations.

**Validation:** Re-run the focused tests and inspect the complete diff.

### M3 — Full verification and delivery
1. Run full frontend tests, lint, production build, and `git diff --check`.
2. Confirm the change is limited to `Settings.tsx`, its focused tests, and the M69 task packet.
3. Commit and push the branch; open a PR against `fix/m68-barangay-settings-load-error-recovery` without merging.
4. Record actual hosted checks and verify checks on the final PR head.

## Risks and controls
- **Misleading defaults:** Hide preference controls after a failed profile GET so a toggle cannot write a default that was never loaded.
- **False empty security state:** Show a session-specific error instead of “No active sessions found” after a failed GET.
- **Coupled sections:** Keep independent fetch/retry state and assert one retry does not call the other endpoint.
- **Mutation drift:** Assert retries do not call PATCH or DELETE; leave existing mutation handlers untouched.
- **Known separate issue:** Do not alter the existing push-toggle payload in M69; track as a follow-up.
