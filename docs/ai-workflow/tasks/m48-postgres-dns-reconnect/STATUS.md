# Status — M48 PostgreSQL DNS Reconnect CI Smoke

## 1. Executive Summary

- **Task ID:** m48-postgres-dns-reconnect
- **State:** Completed; PR #179 is open and unmerged
- **Current milestone:** Delivery complete; no merge or deployment performed
- **Branch:** test/m48-postgres-dns-reconnect
- **Worktree:** /tmp/gridy-m48-postgres-dns-reconnect
- **Base:** M47 local checkpoint 29f04cc702003bdbec1d2c17a55471c26fc560a9, tree dab1c9920e11c3894d1a52a8f4eb50b21b83b094; equivalent remote tree on PR #178.
- **Implementer:** Codex (user-directed sole-agent mode)

## 2. Progress

| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Build the disposable DNS-switch harness | Complete locally | Added the probe, isolated two-network Compose stack, and project-scoped smoke runner. Local runtime could not start Docker because the daemon socket denied access. |
| M2 — Integrate CI and document evidence boundary | Complete locally | Added an independent read-only CI job and documented that provider failover remains unverified. |
| M2 follow-up — Correct probe startup path | Complete; hosted verified | The first hosted run exposed that direct execution did not place `/app` on `sys.path`; the probe now adds its backend root before `django.setup()`. The final hosted run passed. |
| M2 follow-up — Normalize PostgreSQL address output | Complete; hosted verified | PostgreSQL initially returned `10.253.240.10/32`; the probe now uses `host(inet_server_addr())`. The final hosted run confirmed the primary and failover host addresses. |
| M2 follow-up — Match Django's connection health check contract | Complete; hosted verified | Run #384 showed Django's configured `CONN_HEALTH_CHECKS=True` can reconnect before executing the query and return HTTP 200 immediately. The plan and smoke now permit immediate recovery or transient 503 while requiring failover IP `10.253.240.11` within a bounded sequence. Run #388 passed this criterion. |

## 3. Baseline and Decisions

- M43's regression test establishes that DATABASES retains the hostname and does not set hostaddr; it does not change DNS or interrupt an active PostgreSQL connection.
- M47 / ADR 014 requires a separate non-production DNS failover/reconnect rehearsal before relying on managed database failover.
- The smoke will use two separate Postgres containers and a persistent Django probe server, not the main Compose project.
- Docker-network alias reassignment will be described as a CI reliability check. It cannot prove Azure DNS/failover timing, TLS, or live service behavior.
- Hindsight initiative capture was attempted but the local service refused connections at 127.0.0.1:9077; no memory content informed this plan.

## 4. Files Changed or Created

- .github/workflows/ci.yml
- architecture/11-deployment-and-ci-cd.md
- backend/tests/postgres_dns_reconnect_probe.py
- scripts/ci/postgres-dns-reconnect.compose.yml
- scripts/ci/postgres-dns-reconnect-smoke.sh
- docs/ai-workflow/tasks/m48-postgres-dns-reconnect/{TASK_BRIEF.md,PLAN.md,STATUS.md}

Read-only references: M47 task status and ADR 014.

## 5. Verification Log

| Check | Command | Result |
| --- | --- | --- |
| Branch creation | git worktree add -b test/m48-postgres-dns-reconnect /tmp/gridy-m48-postgres-dns-reconnect HEAD from M47 worktree | Created at local M47 checkpoint 29f04cc702003bdbec1d2c17a55471c26fc560a9 (tree dab1c9920e11c3894d1a52a8f4eb50b21b83b094). |
| Hindsight | hindsight_capture_initiative | Unavailable: ECONNREFUSED 127.0.0.1:9077; no page content returned. |
| Docker runtime | `docker info --format '{{.ServerVersion}}'` | Failed: permission denied connecting to `/var/run/docker.sock`; no containers were started. Hosted CI is required for the runtime network-switch result. |
| Shell syntax | `bash -n scripts/ci/postgres-dns-reconnect-smoke.sh` | PASS: no syntax errors. |
| Probe compilation | `python -m py_compile backend/tests/postgres_dns_reconnect_probe.py` | PASS: helper compiled. |
| Compose rendering | `DOCKER_CONFIG=/tmp/m48-docker-config docker compose --file scripts/ci/postgres-dns-reconnect.compose.yml config --format json` | PASS: configuration rendered with two Postgres services, a Django probe, isolated networks, tmpfs databases, and no host ports. This does not start containers. |
| Workflow validation (initial parser) | Python `yaml.safe_load()` workflow assertion | Initial attempt failed because the default YAML 1.1 parser treats the `on` key as boolean `True`; no repository file was affected. |
| Workflow validation (corrected parser) | Python `yaml.load(..., Loader=yaml.BaseLoader)` assertions | PASS: DNS smoke job is present with a 15-minute timeout, repository contents permission is read-only, and push/PR triggers still target all branches. |
| Isolation and scope scan | Python assertions over Compose services and smoke script; `git diff --name-only`; `git diff --cached --name-only` | PASS: no fixed container names, host ports, persistent volumes, or environment-file writes; tracked changes are the workflow and deployment guide; helper, Compose, and runner files are the only untracked application/test artifacts before staging. |
| Whitespace and diff hygiene | Python trailing-whitespace scan across 7 changed Markdown, Python, shell, and Compose files; `git diff --check`; `git diff --cached --check` | PASS: no trailing whitespace or diff errors. |
| Application tests | Not run | No application runtime code changed; actual same-process DNS-switch behavior will be exercised by hosted CI. |
| First hosted CI runtime attempt | GitHub Actions run #380, job “PostgreSQL DNS reconnect smoke” on PR #179 merge ref `890a7dc2a3cab96404f6dde9fbd1b78570cb978c` | FAIL: databases became healthy, but the probe exited before serving; the runner reported `Django probe did not return an initial response`. The job log showed image build and database startup succeeded. |
| Second hosted CI runtime attempt | GitHub Actions run #382, job “PostgreSQL DNS reconnect smoke” on the PR #179 merge ref | FAIL after startup was fixed: the first HTTP probe succeeded and reached the primary, but the assertion compared `10.253.240.10/32` with `10.253.240.10`. |
| Third hosted CI runtime attempt | GitHub Actions run #384, job “PostgreSQL DNS reconnect smoke” | FAIL against the original assertion: initial connection reached primary `10.253.240.10`; the first probe after network reassignment returned HTTP 200 instead of the contract's required HTTP 503. This is consistent with Django's configured connection health check transparently reopening the connection. |
| Failure reproduction | `SECRET_KEY=m48-local-repro-key ADMIN_REGISTRATION_PASSKEY=m48-local-repro-passkey DATABASE_URL=sqlite:///:memory: python tests/postgres_dns_reconnect_probe.py serve` from `backend/` before the correction | Reproduced `ModuleNotFoundError: No module named 'config.settings'; 'config' is not a package`. |
| Import-path correction | Added the resolved backend directory to `sys.path` before setting up Django in `backend/tests/postgres_dns_reconnect_probe.py` | Follow-up startup reached the socket bind after Django setup, but the local sandbox denied listening sockets (`PermissionError: [Errno 1] Operation not permitted`). This does not verify the local HTTP or PostgreSQL runtime. |
| Django setup after correction | `SECRET_KEY=m48-local-repro-key ADMIN_REGISTRATION_PASSKEY=m48-local-repro-passkey DATABASE_URL=sqlite:///:memory: DEBUG=True python tests/postgres_dns_reconnect_probe.py invalid` from `backend/` | PASS for this narrow check: Django setup completed and the script returned its expected `Use the serve or request mode.` usage message for the intentionally invalid mode; no `ModuleNotFoundError` remained. |
| Local listener attempt | `SECRET_KEY=m48-local-repro-key ADMIN_REGISTRATION_PASSKEY=m48-local-repro-passkey DATABASE_URL=sqlite:///:memory: DEBUG=True timeout 2 /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python tests/postgres_dns_reconnect_probe.py serve` from `backend/` | BLOCKED by the local sandbox: Django setup completed, then binding port 8000 failed with `PermissionError: [Errno 1] Operation not permitted`. |
| PostgreSQL address normalization | Changed the probe query to `SELECT host(inet_server_addr())` | The final hosted CI run confirmed host-only addresses for both primary and failover servers. |
| Django connection-health behavior reference | Read `backend/config/settings.py` and Django 6.0 database docs | `CONN_HEALTH_CHECKS=True` is configured; Django documents that a failed health check reestablishes a connection before query execution without failing the request if the database is available. The M48 acceptance assertion and plan were amended to allow direct recovery or a transient 503 while requiring the failover address within a bounded set of probes. |
| Health-check-aware script and plan static verification | `bash -n scripts/ci/postgres-dns-reconnect-smoke.sh`; `python -m py_compile backend/tests/postgres_dns_reconnect_probe.py`; `DOCKER_CONFIG=/tmp/m48-docker-config docker compose --file scripts/ci/postgres-dns-reconnect.compose.yml config --format json` with service/ports/volume assertions; PyYAML `BaseLoader` workflow assertions; `git diff --check`; Markdown whitespace scan | PASS: shell syntax, Python compilation, Compose rendering and isolation assertions, workflow trigger/timeout/permission assertions, diff hygiene, and whitespace checks all passed. These static checks do not prove the live container switch. |
| Final hosted PR verification | GitHub Actions run #388 (`38140902396`) on PR #179 merge ref `fdccdb41f09b8ee7c76cf8e6d7eee42b650fda5f` | PASS: all seven jobs completed successfully: frontend tests, backend tests, mobile tests, PostgreSQL DNS reconnect smoke, Compose migration gate smoke, frontend image, and backend image. The DNS job log reports primary `10.253.240.10` and subsequent same-process recovery to failover `10.253.240.11` through the reassigned `db` alias. Vercel status on PR head `ff39acdd782200558c2cef6f94a4c4175e270ce4` was success. |

## 6. Delivery Checkpoint

- [x] Implement and statically verify the disposable smoke harness.
- [x] Add the CI job and accurately scoped deployment documentation.
- [x] Re-run PR CI after the health-check-aware assertion change; all seven jobs and the DNS-switch smoke passed.
- **Local content head:** `fbbe20b9db32f01454f38c6418cc510e7b5e8cee`, tree `17cb328c0cfda530381571710b63f570be54d327`.
- **Remote PR head before this status update:** `ff39acdd782200558c2cef6f94a4c4175e270ce4`; its tree matches the local content head.
- **PR:** [#179](https://github.com/ur1el0/KapitBayan/pull/179), open, unmerged, and targeting M47 PR #178. No merge or deployment occurred.
- **Evidence boundary:** The CI proves Docker embedded DNS alias reassignment and reconnection in this disposable harness only; managed-provider/Azure DNS, TLS, and failover timing remain unverified.
