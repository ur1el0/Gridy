# M89 Status: Barangay Admin Field Staff Provisioning

Overall status: Implementation complete; ready for review
Branch: feat/admin-field-staff-provisioning
Base: origin/main at d09a26342c2f47b7ca6c7d9bb9a45e4427366d7f
Worktree: /tmp/gridy-admin-field-staff-provisioning
Initial implementation commit: eda562c (ported the reviewed staff-management endpoint and panel)

## Boundary and Decisions

- Work was performed in an isolated `/tmp` clone because the primary checkout's Git metadata is read-only in this environment.
- The primary checkout and other worktrees were not used for edits. The source branch is based on the local `origin/main` reference at `d09a263` in this clone; the old `feat/admin-staff-management` work was cherry-picked as an implementation starting point.
- The older implementation requested a password from the administrator. M89 removes that field, creates an unusable-password account, and emails a Django expiring/single-use password setup link after the database transaction commits.
- “Mobile-only” means that the supported Field Official workflow is the Flutter client and that the web application has no Field Official workspace. Browser login is rejected and the browser refresh cookie is cleared. This does not cryptographically bind API tokens to a native device.
- No database migration, dependency, Celery, Redis, or payment-processing change was introduced.
- Hindsight memory service could not be reached (`ECONNREFUSED 127.0.0.1:9077`); decisions were grounded in the repository task packet and current source instead.

## Milestone Log

- M1 Backend provisioning and password setup: Complete.
- M2 Admin web staff management and web-role boundary: Complete.
- M3 Cross-layer verification and documentation: Complete.

## Verification Log

Commands were run in `/tmp/gridy-admin-field-staff-provisioning`. Backend checks used the test-only SQLite setting and test secrets below; no production database was accessed.

### Expected red test for unassigned administrators

Before changing the permission class, the new assertion was run:

```bash
PYTHONPATH=backend SECRET_KEY=test-dev-secret-key-123456789012345678901234567890 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend/gridy_auth/tests/test_staff_management.py::TestStaffManagementPermissions::test_admin_without_barangay_receives_403 -q
```

Result: failed as expected because the endpoint returned HTTP 200 with an empty list instead of HTTP 403. The assigned-admin permission was then added, and the focused test passed in the subsequent full auth suite.

### Backend regression suite

```bash
PYTHONPATH=backend SECRET_KEY=test-dev-secret-key-123456789012345678901234567890 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend/gridy_auth/tests/ -q
```

Result: `122 passed, 3 skipped` (25.62s). Skips are existing Cloudinary-dependent tests. Django emitted expected warnings that the isolated worktree has no `backend/staticfiles/` directory.

### Focused backend regression

```bash
PYTHONPATH=backend SECRET_KEY=test-dev-secret-key-123456789012345678901234567890 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend/gridy_auth/tests/test_staff_management.py backend/gridy_auth/tests/test_authentication.py backend/gridy_auth/tests/test_throttling.py -q
```

Result: `31 passed` (10.89s).

### Frontend focused regression

```bash
npm --prefix frontend run test -- --pool=threads src/pages/admin/StaffManagementSettings.test.tsx src/pages/admin/BarangaySettings.test.tsx src/pages/auth/Login.test.tsx src/components/core/ProtectedRoute.test.tsx
```

Result: `4 test files passed, 12 tests passed` (1.78s).

### Frontend lint and production build

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

Results: Oxlint passed with no warnings. TypeScript and Vite production build passed; Vite transformed 2,515 modules and completed in 0.92s.

### Django system and schema checks

```bash
PYTHONPATH=backend SECRET_KEY=test-dev-secret-key-123456789012345678901234567890 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py check
PYTHONPATH=backend SECRET_KEY=test-dev-secret-key-123456789012345678901234567890 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py makemigrations --check --dry-run
```

Results: Django system check reported `0 issues`; `makemigrations --check --dry-run` reported `No changes detected`. The Firebase-unconfigured warning is expected in this local test environment.

OpenAPI command:

```bash
PYTHONPATH=backend SECRET_KEY=test-dev-secret-key-123456789012345678901234567890 ADMIN_REGISTRATION_PASSKEY=test-passkey-secret-12345 DEBUG=True KAPITBAYAN_TEST_USE_SQLITE=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py spectacular --file /tmp/gridy-admin-field-staff-openapi.yml --validate
```

Result: exit code 0; schema output contains 14 warnings and 17 errors (6 and 5 unique respectively), all for unrelated views and path parameters. The same counts and messages were reproduced against a detached `origin/main` worktree at `d09a26342c2f47b7ca6c7d9bb9a45e4427366d7f`. No Staff Management schema warning/error was emitted after adding the `full_name` serializer return type annotation.

### Hygiene and scope

- `git diff --check`: passed with no output.
- `git diff --cached --name-only`: empty at the time of the check.
- `git status`: changes are confined to staff provisioning, password setup validation, admin settings UI, web role routing, tests, and this task packet. No migrations or dependency manifests changed.
- The worktree uses a symlink to the primary checkout's existing `frontend/node_modules` solely to run frontend verification; package files were not changed.

## Current Main Conflict Resolution (2026-10-16)

- Merged current `main` (`da0e47adc76300d51c8d5db35a07e34f26b64f49`) into the feature branch in an isolated worktree at `/tmp/gridy-pr230-conflict-20261016`; the primary checkout and its uncommitted edits were left untouched.
- Resolved four conflicts in `backend/config/settings.py`, `backend/gridy_auth/serializers/__init__.py`, `backend/gridy_auth/tasks.py`, and `frontend/src/components/core/ProtectedRoute.test.tsx`.
- Kept `SECRET_KEY_FALLBACKS`, the mainline removal of shared-passkey admin registration, both `public_navigator` and `staff_management` throttle scopes, both password-reset and staff-setup email tasks, and both route restoration and Field Official guard assertions.
- `git diff --cached --check`: passed with no output. `git ls-files -u`: no unmerged paths. Conflict-marker scan across all four resolved files: no matches.
- Tests were not rerun as part of this merge-conflict update; GitHub CI is expected to validate the updated PR head after it is pushed. The PR remains unmerged.
