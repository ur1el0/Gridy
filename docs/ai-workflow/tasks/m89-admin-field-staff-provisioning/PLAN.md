# M89 Implementation Plan: Barangay Admin Field Staff Provisioning

- Task brief: TASK_BRIEF.md
- Branch: feat/admin-field-staff-provisioning
- Base: origin/main (d09a26342c2f47b7ca6c7d9bb9a45e4427366d7f)
- Complexity: Medium
- Work boundary: isolated /tmp/gridy-admin-field-staff-provisioning; primary checkout and other worktrees remain untouched.

## Milestone 1: Tenant-Scoped Provisioning API and Password Setup
1. Reuse the reviewed feat/admin-staff-management implementation as a source reference, porting its staff list/create/status API and tests onto current origin/main.
2. Restrict all management actions to authenticated ADMIN accounts with an assigned barangay. Derive role and tenant in the view; make staff lookups use the authenticated admin's barangay; reject client-controlled privilege/tenant fields.
3. Replace admin-entered initial passwords with unusable-password accounts and an expiring password setup/reset link sent after commit. Add a dedicated email task with neutral setup wording; never expose credentials or tokens in responses/logs.
4. Apply Django password validation to the existing password-confirm serializer used by setup links; preserve generic password-reset responses and session revocation semantics.
5. Keep create/audit operations transactional. Deactivation must revoke active refresh sessions and record the status change. Add OpenAPI schemas and scoped throttling.
6. Add backend tests for role boundaries, unassigned admins, tenant scoping, spoofed fields, duplicates, unusable initial password, setup-mail dispatch, audit trail, activation/deactivation, and refresh-session revocation.
7. Confirm the user model does not require a migration.

Validation:
  cd /tmp/gridy-admin-field-staff-provisioning
  PYTHONPATH=backend /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend/gridy_auth/tests/test_staff_management.py
  DEBUG=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py check
  DEBUG=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py makemigrations --check --dry-run

## Milestone 2: Barangay Settings Staff Interface
1. Add a focused StaffManagementSettings panel to BarangaySettings.
2. Collect first name, last name, username, and email only. Do not offer a password or role/tenant selectors.
3. List only the authenticated admin's returned staff, show active state, and provide activate/deactivate actions with clear confirmation/error states.
4. Provide semantic labels, keyboard-operable controls, visible focus styling, and loading/retry/empty/success/error states. Explain that staff set their own password from the emailed setup link and use the mobile app for field operations.
5. Add Vitest coverage for successful creation, API errors, list retry, status changes, and absence of password inputs.
6. Keep Field Official accounts out of the web workspace: reject them in the web login flow, clear the browser refresh session created by the shared login endpoint, and route stale/direct browser sessions to a mobile-app guidance page instead of an admin redirect loop.

Validation:
  npm --prefix frontend run test -- src/pages/admin/StaffManagementSettings.test.tsx src/pages/admin/BarangaySettings.test.tsx
npm --prefix frontend run test -- src/pages/auth/Login.test.tsx src/components/core/ProtectedRoute.test.tsx
  npm --prefix frontend run lint
  npm --prefix frontend run build

## Milestone 3: Cross-Layer Verification and Documentation
1. Verify the new Field Official logs into Flutter and continues to route to FieldOfficialScreen; confirm the web route guard still denies FIELD_OFFICIAL.
2. Generate/validate OpenAPI schema if the repository's configured command is available.
3. Run targeted backend and frontend suites, Django checks, migration dry-run, and diff hygiene. Record actual commands/output in STATUS.md.
4. Confirm there are no migrations, Celery/Redis additions, production database operations, changes to the primary checkout, or edits to supplied environment/logo assets.
5. Review the final diff for complete tenant boundaries, no password/token leakage, and alignment between API and UI.

Validation:
  PYTHONPATH=backend /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend/gridy_auth/tests/test_staff_management.py backend/gridy_auth/tests/test_account_lifecycle.py
  npm --prefix frontend run test -- src/pages/admin/StaffManagementSettings.test.tsx src/pages/admin/BarangaySettings.test.tsx
  npm --prefix frontend run lint
  npm --prefix frontend run build
  DEBUG=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py check
  DEBUG=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py makemigrations --check --dry-run
  git diff --check

## Risks and Mitigations
- Password reset may be requested only by a mailbox owner; preserve generic response behavior and use the existing signed, expiring token generator.
- transaction.on_commit ensures an email isn't sent for a rolled-back account. The asynchronous email helper is best-effort; the standard forgot-password path remains the recovery route.
- Do not infer native-app identity from User-Agent or request headers. API authorization remains role-scoped and the web client has no Field Official workspace.
- If current-main code differs from the reference implementation, prefer the current-main contract and document any necessary minimal plan adjustment before making the conflicting edit.

## Milestone 4: Synchronize with Current Main and Resolve Merge Conflicts
1. Merge current `main` into this published feature branch without rewriting its history.
2. Preserve the mainline secret-key fallback and removal of shared-passkey administrative registration; do not restore the removed `AdminRegisterSerializer` or `ADMIN_REGISTRATION_PASSKEY` requirement.
3. Keep both current-main password-reset mail dispatch and the Field Official setup-mail task.
4. Keep both public-navigator and staff-management throttle rates.
5. Combine the route-restore regression test with the Field Official web-boundary test, marking the mocked auth state ready for the latter.
6. Inspect for remaining conflict markers and run `git diff --check`. CI will run after the PR branch update; do not merge the PR as part of this milestone.
