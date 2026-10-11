# Plan: M43 — Release Migration and Database DNS Resilience

## Overview

- **Task brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `fix/m43-release-migration-dns-safety`
- **Base:** M42 `043cec79a45a853b8ec47afa66a3327c5d095d5c`
- **Complexity:** Medium
- **Work mode:** Codex plans, implements, verifies, reviews, and records delivery. Keep all work isolated from the primary checkout.

## Milestones

### M1 — Baseline and task contract

1. Confirm the M42 base and clean isolated worktree.
2. Inspect entrypoint, Docker Compose, database settings, deployment docs, CI/test runner, and M42 findings.
3. Record the task contract and plan before source edits.

**Validation:** `git status --short --branch`; targeted source inspection; confirm task packet paths and the primary checkout's pre-existing untracked files are untouched.

### M2 — Runtime and migration lifecycle

1. Make `backend/entrypoint.sh` only select its default Gunicorn command and `exec` the supplied/default process; remove automatic migration execution.
2. Add a one-shot Compose `migrate` service that uses the backend image/environment, waits for healthy `db`, and exits after `python manage.py migrate --noinput`.
3. Make `backend` depend on successful completion of `migrate` as well as healthy `db`; do not start a Compose stack against an existing developer database during verification.
4. Remove settings-import DNS resolution and `hostaddr` injection. Retain `CONN_MAX_AGE=60` and `CONN_HEALTH_CHECKS=True`.
5. Add regression tests proving entrypoint forwarding does not run a migration and importing settings with a hostname neither calls a resolver nor configures `hostaddr`.

**Validation:** targeted pytest; `bash -n backend/entrypoint.sh`; Compose configuration validation. Use local SQLite/test settings and do not run production or live database migrations.

### M3 — Deployment contract and verification

1. Update deployment/operations docs to describe Compose ordering and the serialized one-off migration release gate for non-Compose platforms.
2. Run the focused regression tests and the full backend suite, Django system check, and migration dry-run.
3. Verify the Compose configuration without starting services; verify no schema, dependency, cloud, or primary-checkout changes.
4. Update `STATUS.md` with exact commands and actual results, self-review the complete diff, and create a scoped checkpoint commit.

**Validation commands:**

```bash
DEBUG=True SECRET_KEY=m43-local-test-key ADMIN_REGISTRATION_PASSKEY=m43-local-passkey DATABASE_URL=sqlite:///db.sqlite3 /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend/tests/test_deployment_runtime.py -q
bash -n backend/entrypoint.sh
docker compose config --format json  # run through a wrapper that creates and removes temporary empty env files if absent
DEBUG=True SECRET_KEY=m43-local-check-key ADMIN_REGISTRATION_PASSKEY=m43-local-check-passkey DATABASE_URL=sqlite:///db.sqlite3 /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py check
DEBUG=True SECRET_KEY=m43-local-check-key ADMIN_REGISTRATION_PASSKEY=m43-local-check-passkey DATABASE_URL=sqlite:///db.sqlite3 /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py makemigrations --check --dry-run
DEBUG=True SECRET_KEY=m43-local-check-key ADMIN_REGISTRATION_PASSKEY=m43-local-check-passkey DATABASE_URL=sqlite:///db.sqlite3 /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend
git diff --check
```

The repository-local `venv` may be invoked by its absolute primary-checkout path if it is absent in the isolated worktree. Compose config must use disposable local env-file placeholders only if Compose requires them; do not create or modify a developer's persistent environment files.

### M4 — Delivery and next milestone

1. Push the M43 branch to the canonical GitHub repository and open a PR targeting M42 `audit/m42-azure-migration-readiness`, preserving the existing stack (#172 → #173 → M43).
2. Do not merge or deploy. Record the PR and remote status.
3. After M43 is saved and reviewable, inspect the M42 remaining gates and start the next independently scoped, non-production milestone on a new branch without waiting for the PR to merge.

## Risks and rollback

- A failed `migrate` service blocks the Compose backend as intended; diagnose the migration and explicitly rerun the one-shot service after correction.
- Compose service dependency ordering is verified as configuration, not by starting services against any existing local database volume.
- Removing `hostaddr` restores hostname resolution for new connections; existing open connections remain governed by Django's current connection lifecycle and health checks.
- The prior IPv4 workaround was introduced in `08cbe41`; actual provider reachability is unverified. PostgreSQL 15 libpq documents that it looks up `host` when `hostaddr` is absent and tries each resolved address until a connection succeeds ([connection documentation](https://www.postgresql.org/docs/15/libpq-connect.html)).
- The unreferenced `backend/build.sh` remains a manually invoked local setup script with explicit migration/seeding commands; it is not run by the container entrypoint, Compose image build, or CI workflow. This task does not change that helper.
- This change does not configure a live Render release command or Azure migration job. Operators must implement the documented release gate in their platform configuration before rollout.
- Rollback is a code/configuration revert. Do not reverse database migrations as part of this task.

## Plan amendments

- None at baseline. If source or tool evidence prevents a planned validation, record it and use a safe equivalent without widening the implementation scope.
