# Status — M48 PostgreSQL DNS Reconnect CI Smoke

## 1. Executive Summary

- **Task ID:** m48-postgres-dns-reconnect
- **State:** Hosted runtime follow-up in progress; CI identified two probe defects and both have focused local fixes pending hosted confirmation
- **Current milestone:** Re-run hosted integration verification after the address normalization correction
- **Branch:** test/m48-postgres-dns-reconnect
- **Worktree:** /tmp/gridy-m48-postgres-dns-reconnect
- **Base:** M47 local checkpoint 29f04cc702003bdbec1d2c17a55471c26fc560a9, tree dab1c9920e11c3894d1a52a8f4eb50b21b83b094; equivalent remote tree on PR #178.
- **Implementer:** Codex (user-directed sole-agent mode)

## 2. Progress

| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Build the disposable DNS-switch harness | Complete locally | Added the probe, isolated two-network Compose stack, and project-scoped smoke runner. Local runtime could not start Docker because the daemon socket denied access. |
| M2 — Integrate CI and document evidence boundary | Complete locally | Added an independent read-only CI job and documented that provider failover remains unverified. |
| M2 follow-up — Correct probe startup path | Fixed locally; hosted confirmation pending | The first hosted run failed because direct execution of `tests/postgres_dns_reconnect_probe.py` did not place `/app` on `sys.path`, so Django could not import `config.settings`. The probe now adds its backend root before `django.setup()`. |
| M2 follow-up — Normalize PostgreSQL address output | Fixed locally; hosted confirmation pending | The next hosted run successfully served the initial probe, then failed because `inet_server_addr()::text` returned `10.253.240.10/32`. The SQL now uses `host(inet_server_addr())` to compare the host address without the prefix length. |

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
| Failure reproduction | `SECRET_KEY=m48-local-repro-key ADMIN_REGISTRATION_PASSKEY=m48-local-repro-passkey DATABASE_URL=sqlite:///:memory: python tests/postgres_dns_reconnect_probe.py serve` from `backend/` before the correction | Reproduced `ModuleNotFoundError: No module named 'config.settings'; 'config' is not a package`. |
| Import-path correction | Added the resolved backend directory to `sys.path` before setting up Django in `backend/tests/postgres_dns_reconnect_probe.py` | Follow-up startup reached the socket bind after Django setup, but the local sandbox denied listening sockets (`PermissionError: [Errno 1] Operation not permitted`). This does not verify the local HTTP or PostgreSQL runtime. |
| Django setup after correction | `SECRET_KEY=m48-local-repro-key ADMIN_REGISTRATION_PASSKEY=m48-local-repro-passkey DATABASE_URL=sqlite:///:memory: DEBUG=True python tests/postgres_dns_reconnect_probe.py invalid` from `backend/` | PASS for this narrow check: Django setup completed and the script returned its expected `Use the serve or request mode.` usage message for the intentionally invalid mode; no `ModuleNotFoundError` remained. |
| Local listener attempt | `SECRET_KEY=m48-local-repro-key ADMIN_REGISTRATION_PASSKEY=m48-local-repro-passkey DATABASE_URL=sqlite:///:memory: DEBUG=True timeout 2 /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy/venv/bin/python tests/postgres_dns_reconnect_probe.py serve` from `backend/` | BLOCKED by the local sandbox: Django setup completed, then binding port 8000 failed with `PermissionError: [Errno 1] Operation not permitted`. |
| PostgreSQL address normalization | Changed the probe query to `SELECT host(inet_server_addr())` | Expected result is a host-only address string. The disposable PostgreSQL runtime assertion must be rechecked by hosted CI because Docker is unavailable locally. |

## 6. Remaining Work

- [x] Implement and statically verify the disposable smoke harness.
- [x] Add the CI job and accurately scoped deployment documentation.
- [ ] Re-run PR CI after address normalization, record the DNS-switch smoke plus all other job results, and keep the PR unmerged without deploying.
