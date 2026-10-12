# M44 — Compose Migration Gate CI Smoke Test

## 1. Metadata

- **Task ID:** `m44-compose-migration-gate-ci`
- **Task Type:** CI / deployment verification
- **Target Components:** Docker Compose, GitHub Actions, task documentation
- **Lead / Writer:** Codex (user-directed sole-agent mode)
- **Reviewer:** Codex self-review
- **Branch:** `test/m44-compose-migration-gate-ci`
- **Base:** M43 saved tree (`2f47d48`; tree `8a6000932e6329c4677a27f747827d636852b6fc`)

## 2. Objective and Scope

- **Goal:** Add a reproducible CI smoke test proving that the M43 Compose migration service gates backend startup on both successful and failed migrations, and make the existing CI workflow eligible for pull requests targeting any branch.
- **Non-goals:** No production deployment or provider configuration, cloud resource changes, schema/model changes, dependency changes, application behavior changes, secrets, or migration execution against persistent/deployed databases.
- **Context:** M43 added a one-shot `migrate` service and `backend` dependency on `service_completed_successfully`, but CI currently builds images and runs application tests without exercising the Compose gate. The workflow’s `pull_request` filter currently targets only `main`, which excludes manually stacked PRs targeting a feature branch.

## 3. Current Behavior and Evidence

- `docker-compose.yml` defines `db`, one-shot `migrate`, and `backend`; backend waits for healthy DB and successful migration.
- `.github/workflows/ci.yml` has `pull_request.branches: ["main"]`; push already matches all branches.
- CI does not start the Compose migration sequence or prove that a failing migration prevents backend startup.
- The Compose file references root `.env` and `backend/.env`, and has fixed container names/host ports. A smoke script must use an isolated disposable runner/project, refuse to replace pre-existing env files or fixed-name containers, and clean up only its own resources.
- Local Docker Compose is installed, but local access to `/var/run/docker.sock` is denied. Real container execution therefore must be verified by the hosted CI run; local validation will cover shell syntax, workflow/Compose structure, and static safety checks.

## 4. Required Rules

- Run migrations only against a fresh, disposable PostgreSQL container and project volume created by the smoke script.
- Do not start or modify the developer’s local Compose stack, database, volumes, environment files, or any deployed database.
- Never expose credentials in logs; test-only values may be written into transient env files on the CI runner and removed by a trap.
- Keep production startup and provider-specific release configuration unchanged.
- Do not add Celery, Redis, Python/npm packages, models, or migrations.

## 5. Observable Acceptance Criteria

1. **AC-1 — Successful path:** The smoke script starts the disposable PostgreSQL service, runs the migration service to exit code 0, starts the backend only after migration completion, and observes HTTP 200 from `/api/v1/health/`.
2. **AC-2 — Failure path:** With a temporary Compose override making the migration process exit non-zero, Compose reports failure and no backend container is running.
3. **AC-3 — Isolation and cleanup:** The script uses a unique Compose project, refuses to overwrite pre-existing `.env` or `backend/.env` and fixed-name containers, removes only its temporary env/override files and project resources, including its volume, on success or failure.
4. **AC-4 — CI integration:** A dedicated GitHub Actions job invokes the smoke script, and the workflow's `pull_request` branch filter includes all target branch names so stacked PR targets are eligible.
5. **AC-5 — Scope safety:** No application runtime, schema, dependency, secret, production, or cloud configuration changes are introduced.
6. **AC-6 — Evidence:** Local static checks and any available hosted workflow results are recorded truthfully in this `STATUS.md`; unavailable Docker execution is explicitly identified rather than reported as locally passed.

## 6. Files in Scope

- `.github/workflows/ci.yml`
- `scripts/ci/compose-migration-gate-smoke.sh` (new)
- `docs/ai-workflow/tasks/m44-compose-migration-gate-ci/{TASK_BRIEF.md,PLAN.md,STATUS.md}`

## 7. Risks

- Compose uses fixed container names and published ports, so the live smoke belongs on a fresh hosted runner. The script will fail safely when fixed-name containers or developer env files are present.
- A cleanup failure could leave temporary CI resources. Use a single explicit project name and an EXIT trap that runs `docker compose down --volumes --remove-orphans` for that project and removes only files created by the script.
- The local environment cannot reach the Docker socket; a remote Actions run may be needed for final live-container evidence.
