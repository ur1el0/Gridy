# Status — M48 PostgreSQL DNS Reconnect CI Smoke

## 1. Executive Summary

- **Task ID:** m48-postgres-dns-reconnect
- **State:** Implementation and local static checks complete; hosted runtime verification pending
- **Current milestone:** Hosted runtime verification after M1/M2 local completion
- **Branch:** test/m48-postgres-dns-reconnect
- **Worktree:** /tmp/gridy-m48-postgres-dns-reconnect
- **Base:** M47 local checkpoint 29f04cc702003bdbec1d2c17a55471c26fc560a9, tree dab1c9920e11c3894d1a52a8f4eb50b21b83b094; equivalent remote tree on PR #178.
- **Implementer:** Codex (user-directed sole-agent mode)

## 2. Progress

| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Build the disposable DNS-switch harness | Complete locally | Added the probe, isolated two-network Compose stack, and project-scoped smoke runner. Local runtime could not start Docker because the daemon socket denied access. |
| M2 — Integrate CI and document evidence boundary | Complete locally | Added an independent read-only CI job and documented that provider failover remains unverified. |

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

## 6. Remaining Work

- [x] Implement and statically verify the disposable smoke harness.
- [x] Add the CI job and accurately scoped deployment documentation.
- [ ] Record actual hosted run results; keep the PR unmerged and do not deploy.
