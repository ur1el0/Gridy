# Implementation Plan: M39 Mobile Profile Metadata Recovery

## Milestone 1: Baseline and Reproduction

- Confirm the isolated worktree starts clean from current `origin/main`.
- Add regression coverage to `mobile/test/profile_evidence_test.dart` proving an ordinary profile update omits both evidence type fields and an explicit dropdown change includes its field.
- Run the focused test before the source fix and record the red result.

## Milestone 2: Minimal Fix

- Add one explicit-change flag per evidence type in `ProfileScreen`.
- Reset each flag in `_resetFieldsFromUser`, which is used when edit state is cancelled and after a successful save.
- Set a flag only in the corresponding dropdown callback.
- Pass `null` to `AuthService.updateProfile` unless that type changed; its existing serializer omits null metadata fields.
- Preserve all proof upload/removal and sole-proof protections.
- Rerun the focused regression test and record the green result.

## Milestone 3: Regression Verification and Delivery

- Run the complete mobile test suite and Flutter static analysis.
- Run `git diff --check`; inspect that only the profile screen, its focused tests, and this task packet changed.
- Confirm no migrations or dependency files changed.
- Commit and push the scoped branch, then open a PR against `main`. Do not merge or deploy.
- Record only commands actually run and their exact results in `STATUS.md`.

## Risks

- A reset path that leaves a flag set could resend a fallback value on a later edit; test both cancel and post-save reset paths.
- Existing unrecognized metadata must remain in local/server state when omitted from a PATCH payload.
