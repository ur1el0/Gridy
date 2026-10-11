# Status: M40 - Local Demo Role Seeding Safety

## 1. Executive Summary

- **Task ID:** `m40-local-demo-role-seeding`
- **State:** Implementation Complete; Ready for Codex Review
- **Current Milestone:** M4 complete
- **Implementer:** Antigravity
- **Reviewer:** Codex
- **Branch:** `fix/seed-users-command-safety`
- **Base commit:** `2ac904b35d4b7762b474de4121c4bded161a4923`
- **Worktree:** `/tmp/gridy-seed-users-command-safety`

The `seed_users` management command has been hardened with preflight collision protection, atomic database transaction wrapping, resident evidence preservation, and complete credential output redaction. Developer documentation in README has been clarified. All targeted regression tests, full seed tests, Django system checks, and backend test suites have passed cleanly.

## 2. Milestone Progress

| Milestone | Status | Notes |
| --- | --- | --- |
| M1: Baseline and failure-reproduction tests | COMPLETE | Added 4 failure-reproduction tests in `backend/gridy_auth/tests_demo_seed.py` reproducing credential leakage in output, unhandled barangay collision, unhandled username collision, and missing atomic rollback. |
| M2: Safe and atomic provisioning | COMPLETE | Implemented preflight collision protection for usernames, emails, and barangays in `seed_users.py`. Enclosed writes in `transaction.atomic()`. Preserved resident evidence fields on rerun. |
| M3: Credential output and developer instructions | COMPLETE | Redacted password from success message and CLI help text. Updated README.md with clear local-presentation/development boundaries. |
| M4: Full verification and delivery | COMPLETE | 12 targeted seed command tests passed, 18 full seed tests passed, 208 full backend tests passed, check/makemigrations clean, and git diff --check clean. |

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

- **Milestone 2 & 3 Targeted Tests:**
  Command:
  `SECRET_KEY=test-dev-secret-key-12345 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True pytest backend/gridy_auth/tests_demo_seed.py -k SeedUsersCommandTests`
  Output:
  `12 passed, 6 deselected in 13.81s`

- **Full Seed Test Suite:**
  Command:
  `SECRET_KEY=test-dev-secret-key-12345 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True pytest backend/gridy_auth/tests_demo_seed.py`
  Output:
  `18 passed in 14.90s`

- **Full Backend Test Suite:**
  Command:
  `SECRET_KEY=test-dev-secret-key-12345 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True pytest backend`
  Output:
  `208 passed, 5 skipped, 211 warnings, 30 subtests passed in 59.06s`

- **Django System Check:**
  Command:
  `SECRET_KEY=test-dev-secret-key-12345 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True python backend/manage.py check`
  Output:
  `System check identified no issues (0 silenced).`

- **Migration Drift Check:**
  Command:
  `SECRET_KEY=test-dev-secret-key-12345 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True python backend/manage.py makemigrations --check --dry-run`
  Output:
  `No changes detected`

- **Git Diff Check:**
  Command:
  `git diff --check`
  Output:
  Clean (exit code 0).

## 6. Delivery State

- Scoped branch `fix/seed-users-command-safety` contains verified implementation, tests, docs, and task packet.
- No migrations, Celery, or Redis dependencies introduced.
- Primary checkout `/home/dokja/vsc-fedora/all/Projects/django-projects/Gridy` remains completely untouched.
- Ready for atomic commit and push to `origin/fix/seed-users-command-safety`. No PR opened, no deployment performed.
