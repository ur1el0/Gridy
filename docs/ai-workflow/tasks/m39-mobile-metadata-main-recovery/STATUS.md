# Status: M39 Mobile Profile Metadata Recovery

## Summary

- **State:** PR open; hosted validation in progress
- **Branch:** `fix/m39-mobile-metadata-main-recovery`
- **Base:** `d09a26342c2f47b7ca6c7d9bb9a45e4427366d7f` (`main`)
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
| M4: Delivery | IN PROGRESS | Commit pushed and PR #211 opened. Hosted checks are running; no merge or deployment was performed. |

## Verification Log

| Check | Command | Result |
| --- | --- | --- |
| Red regression reproduction | `/home/dokja/development/flutter/bin/flutter test test/profile_evidence_test.dart` before the fix | FAIL as expected: the 4 new metadata payload/reset regressions failed; 12 existing tests passed. |
| Focused mobile evidence suite | `/home/dokja/development/flutter/bin/flutter test test/profile_evidence_test.dart` | PASS: 16 tests. |
| Full mobile suite | `/home/dokja/development/flutter/bin/flutter test` | PASS: 94 tests. |
| Flutter static analysis | `/home/dokja/development/flutter/bin/flutter analyze` | PASS: no issues found. |
| Diff hygiene | `git diff --check` | PASS: clean. |
| Scope check | `git diff --name-only` and `git status --short --branch` | Application changes are limited to `mobile/lib/screens/profile_screen.dart` and `mobile/test/profile_evidence_test.dart`. No migrations, dependency manifests, or lockfiles changed. |

## Formatting Note

The installed Dart formatter reports these legacy files as needing formatting. Applying it rewrote substantial pre-existing code (550 insertions and 235 deletions in the two-file diff), so that formatter-only churn was reverted. The final patch retains only the M39 code/test changes and passes `git diff --check`.

Flutter reported newer packages available outside existing version constraints; package manifests and lockfiles remain unchanged.

## Delivery Checkpoint

- **Commit:** `8a37c99aa05e4b986117570aa75b4364a700e8c8` — `fix(mobile): preserve unchanged resident evidence metadata`.
- **Remote branch:** `origin/fix/m39-mobile-metadata-main-recovery`.
- **Pull request:** [#211](https://github.com/ur1el0/KapitBayan/pull/211), targeting `main`; open and unmerged.
- **Hosted checks at first review:** two CI runs were in progress/queued and Vercel was pending. Recheck PR #211 before merging.
- No deployment or production change was made.
