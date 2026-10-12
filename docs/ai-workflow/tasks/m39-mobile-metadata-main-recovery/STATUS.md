# Status: M39 Mobile Profile Metadata Recovery

## Summary

- **State:** Implementation and local verification complete; delivery review pending
- **Branch:** `fix/m39-mobile-metadata-main-recovery`
- **Base:** `d09a26342c2f47b7ca6c7d9bb9a45e4427366d7f` (`origin/main`)
- **Worktree:** `/tmp/kapitbayan-m39-mobile-metadata-main-recovery`
- **Primary checkout:** Left untouched; its existing untracked skills and logo assets are preserved.

## Baseline Evidence

- The isolated worktree was clean at branch creation.
- `mobile/lib/screens/profile_screen.dart` passed `_secondaryIdType` and `_utilityBillingType` on every `_saveProfile()` call.
- The dropdown callbacks did not record explicit changes.
- `AuthService.updateProfile` omits null evidence type arguments from JSON and multipart payloads.
- The legacy M39 branch was not merged to `main`; the current `main` profile code and tests matched its old baseline before this recovery.

## Progress

| Milestone | Status | Notes |
| --- | --- | --- |
| M1: Baseline and reproduction | COMPLETED | Four new regression cases failed against the original code; the other 12 focused tests passed. |
| M2: Minimal fix | COMPLETED | Added per-field explicit-change tracking, set only from dropdown callbacks, and reset with profile state. |
| M3: Verification | COMPLETED | Focused and full mobile tests, static analysis, and diff checks passed. |
| M4: Delivery | PENDING | Final review, commit, push, and PR creation remain. No merge or deployment planned. |

## Verification Log

| Check | Command | Result |
| --- | --- | --- |
| Red regression reproduction | `/home/dokja/development/flutter/bin/flutter test test/profile_evidence_test.dart` before the fix | FAIL as expected: the 4 new metadata payload/reset regressions failed; 12 existing tests passed. |
| Focused mobile evidence suite | `/home/dokja/development/flutter/bin/flutter test test/profile_evidence_test.dart` | PASS: 16 tests. |
| Full mobile suite | `/home/dokja/development/flutter/bin/flutter test` | PASS: 94 tests. |
| Flutter static analysis | `/home/dokja/development/flutter/bin/flutter analyze` | PASS: no issues found. |
| Diff hygiene | `git diff --check` | PASS: clean. |
| Scope check | `git diff --name-only` and `git status --short --branch` | Only `mobile/lib/screens/profile_screen.dart` and `mobile/test/profile_evidence_test.dart` are changed in application source. No migrations, dependency manifests, or lockfiles changed. |

## Formatting Note

The installed Dart formatter reports these legacy files as needing formatting. Applying it rewrote substantial pre-existing code (550 insertions and 235 deletions in the two-file diff), so that formatter-only churn was reverted. The final patch retains only the M39 code/test changes and passes `git diff --check`.

Flutter reported newer packages available outside existing version constraints; package manifests and lockfiles remain unchanged.
