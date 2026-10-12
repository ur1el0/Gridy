# M45 — Health Probe Semantics

## 1. Metadata

- **Task ID:** `m45-health-probe-semantics`
- **Task type:** Feature / deployment-readiness hardening
- **Target components:** Django health endpoints and deployment documentation
- **Lead, implementer, and reviewer:** Codex (user-directed sole-agent mode)
- **Branch:** `feat/m45-health-probe-semantics`
- **Base:** M44 checkpoint `91bd0b7cf3ab148b95f94f2b17d233a8b853370a` (tree `c963737cd788d952180a3cf794837e6c642e2a64`)

## 2. Objective and Scope

Add an explicit liveness endpoint that checks only whether Django can serve requests, and a readiness endpoint that checks the database and cache, while preserving the current `/api/v1/health/` route and its response semantics for existing consumers, including Docker Compose.

### In scope

- Add `GET /api/v1/health/live/` with a small stable response and no authentication, database, or cache dependency checks.
- Add `GET /api/v1/health/ready/` using the existing database/cache readiness checks.
- Keep `GET /api/v1/health/` backward-compatible with its existing readiness status codes and response structure.
- Add regression tests for dependency outages, route behavior, and legacy compatibility.
- Update API and deployment observability documentation to define the intended probe roles.

### Non-goals

- Do not change the Dockerfile or Compose health check; the existing `/api/v1/health/` readiness behavior remains in use.
- Do not configure Azure, Render, Vercel, or any live cloud probe, resource, secret, or deployment.
- Do not change migrations, database schema, dependencies, cache implementation, or asynchronous task architecture.
- Do not change unrelated endpoints or health-check payload fields beyond what is required to add and document the new routes.

## 3. Current Behavior and Evidence

- `backend/config/health_views.py` defines `HealthCheckView`, which performs `SELECT 1` and a cache write/read, returning HTTP 503 when either dependency check fails.
- `backend/config/urls.py` mounts that view at `/api/v1/health/` as `health_check`.
- `backend/Dockerfile` probes `/api/v1/health/`; Compose uses backend health to gate frontend startup.
- `backend/gridy_services/tests/test_health.py` covers the existing successful health response and CORS behavior but does not distinguish liveness from readiness or simulate dependency failure.
- M42 audit, `docs/ai-workflow/tasks/m42-azure-migration-readiness/AUDIT.md`, Phase 1 item 5, identifies the need to separate liveness/readiness semantics to avoid restarting the API when dependencies are down.

## 4. Rules and Constraints

- The endpoint is public health telemetry and must not disclose exception details or secrets.
- Liveness must not query the database or cache and should not perform authentication that could introduce a database lookup.
- Readiness continues to use the existing sanitized database/cache checks and HTTP 503 behavior.
- Preserve existing `/api/v1/health/` consumers and Docker readiness behavior.
- No tenant, RBAC, session, treasury, or background-job behavior is changed.
- No Celery/Redis, schema changes, production operations, or live Azure configuration.

## 5. Acceptance Criteria

1. [ ] `GET /api/v1/health/live/` returns HTTP 200 and a stable liveness response even when database and cache probes would raise; it does not invoke those probes or require authentication.
2. [ ] `GET /api/v1/health/ready/` returns the existing combined database/cache readiness payload and HTTP 503 when a required dependency check fails.
3. [ ] `GET /api/v1/health/` remains backward-compatible, including existing healthy response fields and dependency-failure status semantics.
4. [ ] Tests cover the new route semantics and the legacy route; API documentation describes both endpoints and their intended platform roles.
5. [ ] No migrations, schema changes, dependency changes, Docker/Compose changes, or cloud-resource changes are introduced.
6. [ ] Actual verification commands and outputs are recorded in this task's `STATUS.md`; diff hygiene is clean.

## 6. Relevant Files

- `backend/config/health_views.py`
- `backend/config/urls.py`
- `backend/gridy_services/tests/test_health.py`
- `architecture/06-api-endpoint-contracts.md`
- `docs/walkthrough/deployment_observability.md`
- `backend/Dockerfile` and `docker-compose.yml` (read-only compatibility checks)
- `docs/ai-workflow/tasks/m42-azure-migration-readiness/AUDIT.md`

## 7. Risks and Mitigations

- **Risk:** Existing monitors depend on `/health/` payload or status semantics. **Mitigation:** retain the same view and route behavior; test its response and keep Docker configuration unchanged.
- **Risk:** Liveness accidentally depends on DRF authentication or middleware that queries dependencies. **Mitigation:** disable DRF authentication on the liveness view and mock database/cache probes to raise in the liveness regression test.
- **Risk:** Documentation may be mistaken for a live cloud configuration. **Mitigation:** label probe wiring as intended guidance; do not claim any cloud configuration or deployment was applied.
