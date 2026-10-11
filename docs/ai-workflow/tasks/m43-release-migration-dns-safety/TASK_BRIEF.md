# Task Brief: M43 — Release Migration and Database DNS Resilience

## Metadata

- **Task ID:** `m43-release-migration-dns-safety`
- **Task type:** Deployment reliability fix
- **Target components:** Backend container startup, local Compose orchestration, Django database settings, deployment documentation
- **Lead / implementer / reviewer:** Codex (user-directed sole-agent mode)
- **Branch:** `fix/m43-release-migration-dns-safety`
- **Base:** M42 `043cec79a45a853b8ec47afa66a3327c5d095d5c`

## Goal and scope

Separate Django schema migration from API process startup, provide an explicit one-shot migration service in local Docker Compose, and allow new PostgreSQL connections to resolve the configured hostname instead of using an IP cached at Django settings import time.

### Non-goals

- No production database connection, migration, deployment, Azure/Render/Vercel resource, DNS, secret, or credential changes.
- No Django model or schema changes, new migration files, or dependency changes.
- No Azure infrastructure, provider-specific release configuration, background queue, Celery, or Redis work.
- Do not change the existing `DATABASE_URL`, `CONN_MAX_AGE`, database health checks, authentication, or API contracts.
- Preserve the primary checkout and its unrelated untracked files.

## Current behavior and evidence

- `backend/entrypoint.sh` invokes `python manage.py migrate --noinput` before `runserver` or `gunicorn`, coupling DDL work to each API container start.
- `docker-compose.yml` has a backend service waiting for PostgreSQL health, but no distinct migration service.
- `backend/config/settings.py` calls `socket.gethostbyname(db_host)` during settings import and stores the result in libpq `OPTIONS['hostaddr']`; this can leave later connections pinned to an address after the database hostname changes.
- The IP-pinning workaround was introduced by commit `08cbe41` to force IPv4 after a connection failure. The affected live provider/network path is unavailable for verification, so the change must preserve address-family fallback through the hostname-based PostgreSQL client rather than claim that the former incident is resolved in production.
- M42 records these as FINDING-01 and FINDING-02 in `docs/ai-workflow/tasks/m42-azure-migration-readiness/AUDIT.md`.

## Required rules

- Migrations remain explicit, serialized release work and must finish successfully before a new API service starts.
- API replicas must not independently mutate schema on startup.
- Keep the configured PostgreSQL hostname intact and let the PostgreSQL client resolve it when establishing connections.
- Keep database and application lifecycle behavior documented; do not claim a live cloud platform was configured or verified.
- No changes to tenant, RBAC, finance, notification, or private-media behavior are in scope.

## Acceptance criteria

1. `backend/entrypoint.sh` preserves its default Gunicorn command and forwards supplied commands without invoking `manage.py migrate`.
2. Compose defines a one-shot `migrate` service that waits for healthy PostgreSQL; `backend` waits for the migration service to complete successfully. A nonzero migration exit therefore prevents the dependent backend from starting.
3. Django database configuration preserves the hostname and current connection lifetime/health-check settings, and no longer resolves a hostname at settings import or sets `OPTIONS['hostaddr']`.
4. Regression tests cover entrypoint command forwarding and hostname-based settings behavior; Compose configuration and shell syntax are validated.
5. Deployment documentation states that non-Compose releases must run `python manage.py migrate --noinput` exactly once as a serialized pre-release step and gate application startup on success; it must distinguish this documented requirement from any unconfigured live platform.
6. No schema migration, dependency, production/cloud resource, secret, DNS, or data change is introduced; the primary checkout remains untouched.
7. Actual verification commands and outputs are recorded in this task's `STATUS.md`; `git diff --check` is clean and the branch diff stays within the task packet, tests, backend runtime/deployment configuration, and deployment documentation.
