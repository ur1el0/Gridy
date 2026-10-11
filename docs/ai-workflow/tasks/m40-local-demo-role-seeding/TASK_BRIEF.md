# Task Brief: M40 - Local Demo Role Seeding Safety

## 1. Metadata

- **Task ID:** `m40-local-demo-role-seeding`
- **Task Type:** Feature hardening and regression coverage
- **Target Components:** Backend management command and developer documentation
- **Lead / Planner:** Codex
- **Implementer:** Antigravity
- **Reviewer:** Codex
- **Branch:** `fix/seed-users-command-safety`
- **Base Commit:** `2ac904b` (`feat(auth): add seed_users command for development role accounts`)
- **Worktree:** `/tmp/gridy-seed-users-command-safety`

## 2. Objective and Scope

Make `manage.py seed_users` a safe, repeatable local-only way to provision synthetic demo accounts for all application roles, without accidentally overwriting unrelated records or exposing credentials in command output.

### In Scope

- Review and harden `backend/gridy_auth/management/commands/seed_users.py`.
- Reuse and verify `demo_seed_safety.require_local_demo_database`.
- Add regression coverage in `backend/gridy_auth/tests_demo_seed.py`.
- Update the README command instructions and task `STATUS.md` with actual checks.

### Non-Goals

- No production or remote database execution.
- No database schema changes, migrations, new packages, Celery, or Redis.
- No changes to `seed_barangays`, `seed_demo_analytics`, authentication policy, or seeded application data beyond the role accounts owned by this command.
- No fabricated proof images, public media URLs, or changes to resident registration requirements.
- No PR or deployment.

## 3. Current Behavior and Evidence

The implementation already exists in the base commit:

- `backend/gridy_auth/management/commands/seed_users.py` seeds three barangays and ten accounts spanning DILG admin, barangay admin, field official, and resident roles.
- It calls `require_local_demo_database()` before seeding. The helper requires `--confirm-demo-only`, `DEBUG=True`, a local database host, and SQLite or PostgreSQL.
- For an existing username, the command overwrites identity fields, role, barangay, staff status, password, and resident profile fields. A username collision can therefore alter an unrelated local account.
- Writes are not enclosed in one transaction, so an error after initial writes may leave partial fixture state.
- Successful output includes the shared password in plaintext. The README also documents a local default password.
- `backend/gridy_auth/tests_demo_seed.py` currently covers role counts, default/custom credentials, idempotency, DEBUG refusal, confirmation, and remote-host refusal, but not collisions, rollback, or credential redaction.

Existing adjacent policy:

- `backend/gridy_auth/management/commands/demo_seed_safety.py` is the shared local-database guard.
- `seed_barangays` creates local synthetic users with unusable passwords; migration `0014_revoke_seeded_demo_passwords` revoked legacy seeded credentials. `seed_users` is an explicit local-only opt-in for login-ready demo accounts.
- Synthetic resident profiles may be used for local demonstrations, but the command must not manufacture proof files or public evidence URLs.

## 4. Required Business and Architectural Rules

- The command is local-development/presentation tooling only. Every safety guard must run before the first database write.
- DILG admin is cross-barangay and must have `barangay=None`; barangay administrators, field officials, and residents must remain assigned to their intended barangay.
- Only account and barangay identities demonstrably owned by the seed manifest or a documented legacy seed identity may be updated. Unexpected collisions must fail safely before any writes.
- Keep the seed operation atomic so a database or validation error cannot leave a partial set of accounts or barangays.
- Resident fixtures remain clearly synthetic. Do not create placeholder proof files, fake uploads, or public URLs.
- Never print password values or other credentials in command output. Keep any documented default explicitly labeled as local-demo-only.
- Do not weaken M37 resident registration or evidence-management rules.

## 5. Observable Acceptance Criteria

1. **Local-only guard:** The command still refuses to run without `--confirm-demo-only`, with `DEBUG=False`, with a non-local database host, or with an unsupported database vendor. These checks happen before any writes.
2. **Collision protection:** If any seeded username, email identity, or target barangay name belongs to an unexpected/non-seed record, the command exits with a clear `CommandError` and leaves every affected row unchanged. Known current and legacy seed identities, if supported, are enumerated and tested explicitly.
3. **Atomicity:** A failure during provisioning rolls back every write made by that invocation.
4. **Idempotency and role assignment:** Repeated safe runs create no duplicates and leave the ten expected accounts with the intended roles, staff flags, and barangay assignments. DILG remains unassigned; all tenant-bound accounts remain assigned correctly.
5. **Resident fixture integrity:** Resident profiles use synthetic data, no fabricated proof files or public evidence URLs are created, and existing non-seed resident data is never overwritten.
6. **Credential handling:** The command never includes the password value in stdout/stderr. README instructions clearly restrict any default/demo credential to the explicit local-only command.
7. **Regression tests:** Tests cover normal provisioning, repeat execution, custom/default password behavior, every safety guard, collision refusal without mutation, atomic rollback, and output redaction.
8. **Scope and hygiene:** No migrations, dependency changes, unrelated application behavior changes, or infrastructure changes. `git diff --check` is clean and actual verification results are recorded in `STATUS.md`.
9. **Delivery:** Antigravity commits and pushes the scoped branch `fix/seed-users-command-safety` after verification. Do not open a PR or deploy.

## 6. Relevant Files and Documentation

- `backend/gridy_auth/management/commands/seed_users.py`
- `backend/gridy_auth/management/commands/demo_seed_safety.py`
- `backend/gridy_auth/management/commands/seed_barangays.py`
- `backend/gridy_auth/tests_demo_seed.py`
- `backend/gridy_auth/migrations/0014_revoke_seeded_demo_passwords.py` (read-only policy context)
- `README.md`
- `context/RUN_COMMANDS.md`
- `architecture/09-security-and-rbac.md`
- `docs/ai-workflow/tasks/m40-local-demo-role-seeding/PLAN.md`
- `docs/ai-workflow/tasks/m40-local-demo-role-seeding/STATUS.md`

## 7. Constraints and Risks

- Preserve the user's primary checkout and its untracked `.agents/` and logo files; implementation belongs in the isolated worktree.
- Do not run `seed_users` against any persistent or remote database. Use test databases for verification.
- Avoid changing existing synthetic seed behavior outside this command.
- Collision detection must account for the known legacy demo identities without treating arbitrary same-name records as seed-owned.
