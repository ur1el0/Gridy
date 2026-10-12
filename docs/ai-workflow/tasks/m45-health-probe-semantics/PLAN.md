# M45 — Health Probe Semantics Implementation Plan

## 1. Plan Overview

- **Associated brief:** `TASK_BRIEF.md`
- **Target branch:** `feat/m45-health-probe-semantics`
- **Complexity:** Medium
- **Delivery boundary:** One focused milestone; no cloud configuration or deployment.

## 2. Milestone Breakdown

### Milestone 1 — Separate liveness and readiness routes

**Objective:** Provide independent, testable liveness and dependency-readiness semantics without breaking current consumers.

**Files to inspect or modify:**

- `backend/config/health_views.py`
- `backend/config/urls.py`
- `backend/gridy_services/tests/test_health.py`

**Actions:**

1. Add a liveness view at `/api/v1/health/live/` that returns HTTP 200 when Django serves it, does no database/cache probe, and disables DRF authentication to avoid incidental auth database access.
2. Mount the existing `HealthCheckView` at `/api/v1/health/ready/` while retaining the existing `/api/v1/health/` route name and behavior.
3. Add tests asserting liveness remains 200 with dependency calls patched to fail, readiness returns 503 with sanitized dependency failure data, and the legacy route still returns the existing healthy response structure.
4. Keep Dockerfile/Compose probe wiring unchanged and verify this explicitly in the diff.

**Validation commands:**

```bash
DATABASE_URL=sqlite:///db.sqlite3 DEBUG=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend/gridy_services/tests/test_health.py
DATABASE_URL=sqlite:///db.sqlite3 DEBUG=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py check
DATABASE_URL=sqlite:///db.sqlite3 DEBUG=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python backend/manage.py makemigrations --check --dry-run
DATABASE_URL=sqlite:///db.sqlite3 DEBUG=True /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/pytest backend
git diff --check
```

**Expected outcome:** Targeted and full backend tests pass; Django check passes; migration dry run reports no changes; no change to Docker/Compose configuration.

### Milestone 2 — Document endpoint contracts and deployment intent

**Objective:** Make the route meanings clear for API consumers and future Container Apps configuration without implying that a cloud probe has been deployed.

**Files to modify:**

- `architecture/06-api-endpoint-contracts.md`
- `docs/walkthrough/deployment_observability.md`

**Actions:**

1. Document `/health/live/` as process responsiveness only and `/health/ready/` as database/cache readiness.
2. Document `/health/` as a compatibility alias retaining current readiness semantics and Docker Compose usage.
3. State that an eventual Azure Container Apps liveness probe should target `/live/` and readiness should target `/ready/`; describe this as configuration guidance only.
4. Avoid claims that any production/cloud configuration was changed or verified.

**Validation commands:**

```bash
git diff --check
rg -n 'health/(live|ready)|health/|liveness|readiness' architecture/06-api-endpoint-contracts.md docs/walkthrough/deployment_observability.md
```

**Expected outcome:** API/deployment docs agree with implemented behavior; M42's open application readiness concern has a concrete endpoint contract.

## 3. Comprehensive Verification

- [ ] Targeted health endpoint tests pass.
- [ ] Full backend pytest suite passes.
- [ ] Django system check passes.
- [ ] Migration dry run reports no changes.
- [ ] `git diff --check` is clean.
- [ ] Dockerfile/Compose health route remains unchanged.
- [ ] CI and PR status are inspected after publishing; no merge or deployment.

## 4. Risks, Dependencies, and Rollback

- No new dependency or database migration is expected.
- Compatibility risk is limited by preserving the old URL and reusing the existing readiness view.
- Rollback is a code-only revert of this branch; no database or cloud rollback is required.

## 5. Decisions

1. Keep `/api/v1/health/` as readiness for existing Docker and external consumers; new platform probes should use explicit `/live/` and `/ready/` routes.
2. Use `AllowAny` with no DRF authentication on liveness, avoiding an auth path that might need database access.
3. Do not alter container healthcheck wiring in this task; cloud platform configuration remains a later, separately authorized deployment task.
