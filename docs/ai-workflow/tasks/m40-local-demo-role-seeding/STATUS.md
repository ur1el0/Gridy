# Status: M40 - Local Demo Role Seeding Safety

## 1. Executive Summary

- **Task ID:** `m40-local-demo-role-seeding`
- **State:** Review Follow-ups (REV-01 through REV-05) Complete; Ready for Codex Re-Review
- **Current Milestone:** M4 complete (with review follow-ups)
- **Implementer:** Antigravity
- **Reviewer:** Codex
- **Branch:** `fix/seed-users-command-safety`
- **Base commit:** `2ac904b35d4b7762b474de4121c4bded161a4923`
- **Initial Implementation Commit:** `988dc4a59267b89500cb5e48bd24de97e28bd64f`
- **Worktree:** `/tmp/gridy-seed-users-command-safety`

The `seed_users` management command has been hardened with preflight collision protection, atomic database transaction wrapping, resident profile row preservation on rerun, exact barangay identity validation, and complete credential and username redaction in command output. All items from Codex's review (REV-01 through REV-05) have been addressed and verified with regression tests. Non-test Django checks were rerun with an explicitly local SQLite database (`DATABASE_URL=sqlite:///db.sqlite3`).

## 2. Milestone Progress & Review Resolutions

| Item | Status | Notes |
| --- | --- | --- |
| M1: Baseline and failure-reproduction tests | COMPLETE | Added 4 failure-reproduction tests in `backend/gridy_auth/tests_demo_seed.py` reproducing credential leakage in output, unhandled barangay collision, unhandled username collision, and missing atomic rollback. |
| M2: Safe and atomic provisioning | COMPLETE | Implemented preflight collision protection for usernames, emails, and barangays in `seed_users.py`. Enclosed writes in `transaction.atomic()`. Preserved resident evidence fields on rerun. |
| M3: Credential output and developer instructions | COMPLETE | Redacted password from success message and CLI help text. Updated README.md with clear local-presentation/development boundaries. |
| M4: Full verification and delivery | COMPLETE | 12 targeted seed command tests passed, 18 full seed tests passed, 208 full backend tests passed, check/makemigrations clean, and git diff --check clean. |
| **REV-01**: Preserve resident profile rows on rerun | COMPLETE | Updated `seed_users.py` to use `get_or_create` without mutating existing resident profile rows on rerun. Added `test_seed_users_preserves_existing_resident_profile_rows_on_rerun`. |
| **REV-02**: Tighten barangay recognition | COMPLETE | Removed loose substring check in `is_recognized_seed_barangay`, enforcing exact equality against known seed metadata. Added `test_seed_users_refuses_barangay_with_partial_or_loose_marker_collision`. |
| **REV-03**: Remove username disclosure in output | COMPLETE | Removed username column from stdout summary table so no usernames or credentials are disclosed in logs. Added `test_seed_users_does_not_disclose_usernames_in_output`. |
| **REV-04**: Rerun non-test checks with local SQLite | COMPLETE | Reran `check` and `makemigrations --check --dry-run` setting `DATABASE_URL=sqlite:///db.sqlite3`. Both clean with 0 issues and 0 changes. |
| **REV-05**: Correct delivery note | COMPLETE | Updated delivery state in Section 6 with the full follow-up commit hash, live remote push evidence, branch, and confirmation that no PR or deployment was performed. |

## 3. Baseline Evidence

- Base commit `2ac904b` adds the `seed_users` command, five tests, and README instructions.
- The command currently uses `require_local_demo_database()` before provisioning, then updates existing matching users and resident profiles and prints the shared password.
- The shared guard requires explicit confirmation, `DEBUG=True`, a local database host, and SQLite/PostgreSQL.
- Baseline execution of existing 5 tests passed:
  ```
  backend/gridy_auth/tests_demo_seed.py::SeedUsersCommandTests::test_seed_users_provisions_all_four_roles_with_default_password PASSED
  backend/gridy_auth/tests_demo_seed.py::SeedUsersCommandTests::test_seed_users_refuses_remote_database_hosts PASSED
  backend/gridy_auth/tests_demo_seed.py::SeedUsersCommandTests::test_seed_users_refuses_when_debug_is_disabled PASSED
  backend/gridy_auth/tests_demo_seed.py::SeedUsersCommandTests::test_seed_users_requires_explicit_confirmation PASSED
  backend/gridy_auth/tests_demo_seed.py::SeedUsersCommandTests::test_seed_users_supports_custom_password_and_is_idempotent PASSED
  ```
- Added 4 failure-reproduction tests for M40 safety gaps:
  1. `test_seed_users_does_not_leak_password_in_output`: FAILED (plaintext password printed in summary).
  2. `test_seed_users_refuses_unexpected_barangay_collision_without_mutating_record`: FAILED (CommandError not raised, unexpected barangay reused).
  3. `test_seed_users_refuses_unexpected_username_collision_without_mutating_record`: FAILED (CommandError not raised, unexpected user overwritten).
  4. `test_seed_users_rolls_back_atomically_on_failure`: FAILED (partial records remained after failure, no atomic transaction).
- Result: 4 failed, 5 passed, 6 deselected.

## 4. Files in the Planned Scope

- `backend/gridy_auth/management/commands/seed_users.py`
- `backend/gridy_auth/tests_demo_seed.py`
- `README.md`
- `docs/ai-workflow/tasks/m40-local-demo-role-seeding/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m40-local-demo-role-seeding/PLAN.md`
- `docs/ai-workflow/tasks/m40-local-demo-role-seeding/STATUS.md`

## 5. Verification Log

- **Milestone 1 Failure-Reproduction Run:**
  Command:
  `SECRET_KEY=test-dev-secret-key-12345 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True pytest backend/gridy_auth/tests_demo_seed.py -k SeedUsersCommandTests`
  Output:
  `4 failed, 5 passed, 6 deselected in 12.22s`

- **Post-Hardening Seed Command Tests (including REV-01, REV-02, REV-03):**
  Command:
  `SECRET_KEY=test-dev-secret-key-12345 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True pytest backend/gridy_auth/tests_demo_seed.py`
  Output:
  `21 passed in 20.22s`

- **Full Backend Test Suite:**
  Command:
  `SECRET_KEY=test-dev-secret-key-12345 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True pytest backend`
  Output:
  `208 passed, 5 skipped, 211 warnings, 30 subtests passed in 59.06s`

- **Django System Check (REV-04: Explicit Local SQLite Database):**
  Command:
  `SECRET_KEY=test-dev-secret-key-12345 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True DATABASE_URL=sqlite:///db.sqlite3 python backend/manage.py check`
  Output:
  `System check identified no issues (0 silenced).`

- **Migration Drift Check (REV-04: Explicit Local SQLite Database):**
  Command:
  `SECRET_KEY=test-dev-secret-key-12345 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True DATABASE_URL=sqlite:///db.sqlite3 python backend/manage.py makemigrations --check --dry-run`
  Output:
  `No changes detected`

- **Git Diff Check:**
  Command:
  `git diff --check`
  Output:
  Clean (exit code 0).

## 6. Delivery State (REV-05)

- **Branch:** `fix/seed-users-command-safety`
- **Initial Implementation Commit:** `988dc4a59267b89500cb5e48bd24de97e28bd64f`
- **Review Follow-up:** `0eaeb4278ed42d41a7196348316b99c7fb87ee97` on branch `fix/seed-users-command-safety`, addressing REV-01 through REV-05.
- **Remote Push:** Verified before this status-only documentation commit. An explicit fetch of `refs/heads/fix/seed-users-command-safety` succeeded, and a live `git ls-remote --heads origin refs/heads/fix/seed-users-command-safety` query returned `0eaeb4278ed42d41a7196348316b99c7fb87ee97`; the fetched local `origin/fix/seed-users-command-safety` tracking ref resolved to the same SHA. This confirms the follow-up commit was present on origin at verification time.
- **PR Status:** No PR opened (per instructions).
- **Deployment Status:** No deployment performed.
- **Primary Checkout Safety:** `/home/dokja/vsc-fedora/all/Projects/django-projects/Gridy` remains completely untouched.
