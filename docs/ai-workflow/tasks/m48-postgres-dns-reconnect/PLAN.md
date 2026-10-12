# M48 — PostgreSQL DNS Reconnect CI Smoke Plan

## 1. Plan Overview

- **Associated brief:** TASK_BRIEF.md
- **Target branch:** test/m48-postgres-dns-reconnect
- **Complexity:** Medium
- **Delivery boundary:** Disposable CI reliability test plus documentation; no production or cloud operations.

## 2. Milestone Breakdown

### Milestone 1 — Build the disposable DNS-switch harness

**Objective:** Exercise a new Django PostgreSQL connection after the hostname's Docker DNS target changes, in the same long-lived probe server process.

**Files to inspect or modify:**

- backend/tests/postgres_dns_reconnect_probe.py (new)
- scripts/ci/postgres-dns-reconnect.compose.yml (new)
- scripts/ci/postgres-dns-reconnect-smoke.sh (new)
- scripts/ci/compose-migration-gate-smoke.sh (read-only safety pattern)
- backend/config/settings.py and backend/entrypoint.sh (read-only evidence)

**Actions:**

1. Run a minimal HTTP probe in one backend image container, import Django settings, and query `host(inet_server_addr())` through Django's normal connection wrapper so the returned address omits the CIDR prefix length.
   - When invoking the probe file directly, explicitly put the backend project root on `sys.path` so `config.settings` and the Django apps resolve from `/app/tests` as well as from `manage.py` entry points.
2. Start a primary database and a standby database with distinct static IPs on separate test networks. Only the primary initially owns DNS alias db; both stores are ephemeral.
3. Verify the initial address, terminate/detach the primary, attach the standby to the shared network with alias `db`, and verify that a bounded sequence of requests reaches the new server address in the same Django process. Permit an initial 503 while the new target becomes available, but do not require one: because `CONN_HEALTH_CHECKS=True`, Django can detect the stale connection and reconnect before executing the query in the first post-switch request.
4. Use a unique Compose project, no host ports/fixed names/persistent volumes, no env-file writes, and an EXIT cleanup trap scoped to that project.
5. Run local shell syntax, Compose config rendering, workflow parsing, and helper compilation checks. If local Docker daemon access is unavailable, do not start containers; require hosted CI for runtime evidence.

**Validation commands:**

- bash -n scripts/ci/postgres-dns-reconnect-smoke.sh
- python -m py_compile backend/tests/postgres_dns_reconnect_probe.py
- DOCKER_CONFIG=/tmp/m48-docker-config docker compose --file scripts/ci/postgres-dns-reconnect.compose.yml config --format json
- Parse .github/workflows/ci.yml and assert the job exists.
- git diff --check

If the local Docker daemon is available and the smoke's refusal/cleanup guards pass, the full runner may also be run locally. Never run it against the repository's primary Compose stack.

### Milestone 2 — Integrate CI and document the evidence boundary

**Objective:** Ensure every PR target can run the smoke and make its limits clear to operators.

**Files to modify:**

- .github/workflows/ci.yml
- architecture/11-deployment-and-ci-cd.md
- docs/ai-workflow/tasks/m48-postgres-dns-reconnect/{TASK_BRIEF.md,PLAN.md,STATUS.md}

**Actions:**

1. Add a separate CI job with a bounded timeout, no write permissions, and the new smoke script.
2. Preserve the current all-branches pull-request trigger and avoid making unrelated jobs depend on this smoke.
3. State that the CI test proves Docker-network hostname reassignment and Django's later connection recovery in that harness only.
4. Keep actual managed-provider DNS failover, TLS, and non-production Azure parity as unverified gates.
5. Record local limitations and actual hosted check outputs in STATUS.md after publication.

**Expected outcome:** The disposable smoke is isolated and reproducible in GitHub Actions, and documentation does not elevate it to provider failover proof.

## 3. Completion Checklist

- [x] Probe server remains one process across the target change and a bounded sequence demonstrates primary → failover recovery; a transient failure is permitted but not required.
- [x] Compose stack has no host ports, fixed names, persistent volumes, or environment file writes.
- [x] Local static/config checks pass; hosted CI executes the actual container switch.
- [x] Deployment docs distinguish Docker test evidence from provider failover evidence.
- [x] No runtime, schema, dependency, cloud, or production state changes occur.
- [x] Commit and open a stacked PR against M47 PR #178; do not merge or deploy.

## Delivery Evidence

- GitHub Actions PR run #388 (`38140902396`) passed all seven jobs. The DNS smoke log confirmed the persistent Django probe first reached `10.253.240.10`, then reached `10.253.240.11` after reassignment of the Docker `db` alias.
- Vercel Preview status on PR head `ff39acdd782200558c2cef6f94a4c4175e270ce4` was success.
- PR #179 is open and unmerged; no deployment or cloud resource operation occurred.
- The CI harness validates Docker embedded DNS behavior only. Azure/provider failover DNS, TLS, and managed-service recovery timing remain unverified.

## 4. Risks and Rollback

- The disposable stack has a deterministic cleanup trap and is project-scoped; no production or developer data is mounted.
- CI-only failure is addressed by refining the smoke harness. A local inability to access Docker is an environment limitation, not a reason to omit hosted integration evidence.
- No database or application rollback is required; revert the smoke/docs commit if CI cannot run reliably.

## Plan Amendments

- **M48 hosted-run adjustment:** The original contract required exactly one 503 before recovery. GitHub Actions run #384 showed the first post-switch query already returned HTTP 200, after reaching the primary before the switch. `backend/config/settings.py` enables `CONN_HEALTH_CHECKS=True`; Django 6.0 documentation states that the failed health check reestablishes the connection without failing the request when the database server is available. Updated the acceptance criterion to require a bounded same-process connection to the failover address, allowing direct recovery or transient 503 while DNS/service becomes available. This tests the configured reliability behavior instead of requiring an artificial outage response. References: [Django database connection management](https://docs.djangoproject.com/en/6.0/ref/databases/) and [Django `CONN_HEALTH_CHECKS`](https://docs.djangoproject.com/en/6.0/ref/settings/#conn-health-checks).
