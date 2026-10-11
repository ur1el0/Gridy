# Status: M43 — Release Migration and Database DNS Resilience

## Executive summary

- **Task ID:** `m43-release-migration-dns-safety`
- **State:** Implementation and local verification complete; delivery checkpoint pending
- **Current milestone:** M4 — Delivery and next milestone
- **Branch:** `fix/m43-release-migration-dns-safety`
- **Base:** M42 `043cec79a45a853b8ec47afa66a3327c5d095d5c`
- **Worktree:** `/tmp/gridy-m43-release-migration-dns-safety`
- **Implementer:** Codex (user-directed sole-agent mode)

M43 separates API startup from schema migration, adds an explicit Compose migration gate, and removes settings-import DNS/IP pinning. No live Compose services, production database, cloud resources, provider release settings, DNS zones, secrets, or deployment were touched. The primary checkout was preserved.

## Milestone tracker

| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Baseline and task contract | Complete | Confirmed M42 findings and created an isolated worktree. |
| M2 — Runtime and migration lifecycle | Complete | Entrypoint forwards commands only; Compose runs a one-shot migration service before backend startup; hostname resolution remains with libpq. |
| M3 — Deployment contract and verification | Complete | Docs and regression tests updated; focused and full backend verification passed; no schema changes detected. |
| M4 — Delivery and next milestone | In progress | Local checkpoint, push, and stacked PR remain. Continue to the next milestone without waiting for merge. |

## Acceptance criteria status

1. **Entrypoint starts the requested/default process without migrating:** verified by regression tests.
2. **Compose one-shot migration gates backend startup on success:** verified using rendered Compose configuration; services were not started.
3. **Database hostname is not resolved or pinned at settings import:** verified by subprocess test with a stubbed resolver; current connection lifetime and health-check settings remain.
4. **Deployment release contract documented:** added to architecture and operations docs. Live Render/Azure release-job settings remain unconfigured and unverified.
5. **No schema/dependency/cloud/production changes:** migration dry-run reports no changes; diff scope has no migrations or dependency files; no production/cloud actions were performed.
6. **Primary checkout untouched:** confirmed after M43 worktree creation and implementation; its pre-existing untracked `.agents/` and JPEG assets remain outside this branch.

## Files changed

- `architecture/11-deployment-and-ci-cd.md`
- `backend/config/settings.py`
- `backend/entrypoint.sh`
- `backend/tests/test_deployment_runtime.py`
- `docker-compose.yml`
- `docs/walkthrough/deployment_observability.md`
- `docs/ai-workflow/tasks/m43-release-migration-dns-safety/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m43-release-migration-dns-safety/PLAN.md`
- `docs/ai-workflow/tasks/m43-release-migration-dns-safety/STATUS.md`

## Verification log

All Python/Django checks used local test configuration and SQLite. No test command connected to a deployed database.

### Test-first regression proof

- **Initial pytest environment check:** `/home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend/tests/test_deployment_runtime.py -q` was first invoked without required test settings and stopped during pytest-django initialization with `ImportError: Set the SECRET_KEY environment variable`. No tests ran in that attempt.
- **Red command:** `DEBUG=True SECRET_KEY=m43-local-test-key ADMIN_REGISTRATION_PASSKEY=m43-local-passkey DATABASE_URL=sqlite:///db.sqlite3 /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend/tests/test_deployment_runtime.py -q`
- **Red result:** `2 failed, 1 passed`; the tests observed startup migration execution and `hostaddr`/resolver injection in the baseline implementation.
- **Green command:** `DEBUG=True SECRET_KEY=m43-local-test-key ADMIN_REGISTRATION_PASSKEY=m43-local-passkey DATABASE_URL=sqlite:///db.sqlite3 /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend/tests/test_deployment_runtime.py -q`
- **Green result:** The focused tests were rerun after final test-file formatting and passed: `3 passed in 0.38s`.

### Compose and shell validation

- **Command:** a Python wrapper created temporary empty `.env` and `backend/.env` files, executed `docker compose config --format json`, asserted the migration command (`python manage.py migrate --noinput`), the migration service's healthy-DB dependency, `restart: no`, and the backend's `service_completed_successfully` dependency, then removed both temporary files.
- **Output:** `Compose configuration valid; migration command and both dependency gates match M43 contract.`
- **Command:** `bash -n backend/entrypoint.sh`
- **Result:** exited `0`, no output.
- **Safety boundary:** `docker compose up` was not run; no persistent database volume was started or modified.

### Django and backend checks

- **System check command:** `DEBUG=True SECRET_KEY=m43-local-check-key ADMIN_REGISTRATION_PASSKEY=m43-local-check-passkey DATABASE_URL=sqlite:///db.sqlite3 /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py check`
- **Result:** `System check identified no issues (0 silenced).` A warning stated Firebase credentials are not configured, so push notifications are disabled for this local check.
- **Migration dry-run command:** `DEBUG=True SECRET_KEY=m43-local-check-key ADMIN_REGISTRATION_PASSKEY=m43-local-check-passkey DATABASE_URL=sqlite:///db.sqlite3 /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py makemigrations --check --dry-run`
- **Result:** `No changes detected`. The same expected local Firebase configuration warning appeared.
- **Full backend command:** `DEBUG=True SECRET_KEY=m43-local-check-key ADMIN_REGISTRATION_PASSKEY=m43-local-check-passkey DATABASE_URL=sqlite:///db.sqlite3 /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend`
- **Result:** `211 passed, 5 skipped, 211 warnings, 30 subtests passed in 205.89s`.
- **Warnings:** the run reported test/runtime warnings including missing generated `backend/staticfiles/` in the isolated checkout and short test JWT keys; no test failed.

### Git hygiene

- Baseline and post-change inspections show work is isolated to this branch; no `.agents/`, `.codex/`, `.aws/`, logo, or environment files were included.
- `git diff --check` and `bash -n backend/entrypoint.sh` passed with no output after implementation; the final staged diff will be checked before commit.
- Temporary Compose env files were removed; neither `.env` nor `backend/.env` remains in the M43 worktree.
- No migration file, dependency manifest, CI workflow, or cloud configuration was changed.

## Decisions and limitations

- The IPv4-pinning workaround was introduced by `08cbe41` after a network error. PostgreSQL 15's libpq documentation says that without `hostaddr`, it resolves the hostname and tries the resolved addresses until a connection succeeds ([documentation](https://www.postgresql.org/docs/15/libpq-connect.html)). This supports retaining hostname-based resolution, but the old provider/network path is not available, so its specific IPv4 incident remains unverified.
- Hindsight search, list, and initiative capture were attempted on 2026-10-11; all calls returned `ECONNREFUSED 127.0.0.1:9077`. No memory content informed the implementation.
- `backend/build.sh` is not referenced by repository workflow/docs and remains unchanged; it is a manually invoked helper, not the Docker image build or container entrypoint.
- This task documents but does not configure the provider-specific one-off release process. Operators must configure that gate before deploying a new release outside Compose.
- Removing `hostaddr` allows new PostgreSQL connections to use the hostname's current DNS answer. Existing connections still follow the unchanged `CONN_MAX_AGE=60` and health-check lifecycle.

## Remaining work

- [ ] Stage and review only the nine listed M43 files; commit the checkpoint.
- [ ] Push to the canonical GitHub repository and open the stacked PR targeting M42 `audit/m42-azure-migration-readiness`.
- [ ] Record the PR and remote state, then begin the next isolated milestone without merging or deploying.
