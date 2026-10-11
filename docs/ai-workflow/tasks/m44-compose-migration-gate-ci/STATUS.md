# Status — M44 Compose Migration Gate CI Smoke Test

## 1. Executive Summary

- **Task ID:** `m44-compose-migration-gate-ci`
- **State:** Ready for hosted CI verification
- **Current milestone:** M1–M3 implemented; live Docker assertions await the hosted runner
- **Branch:** `test/m44-compose-migration-gate-ci`
- **Worktree:** `/tmp/gridy-m44-compose-migration-gate-ci`
- **Base:** local M43 checkpoint `2f47d48`; tree `8a6000932e6329c4677a27f747827d636852b6fc`
- **Remote M43 PR:** #174, open and unmerged; remote head `6b13201d3a0cb72071fc9b792b254fa7278975d2`, with a tree matching the local M43 checkpoint.
- **Implementer:** Codex (user-directed sole-agent mode)

## 2. Milestone Tracker

| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Baseline and task contract | Complete | Verified M43 tree and workflow/Compose wiring; local Docker socket access denied. |
| M2 — Disposable smoke script | Complete locally | Added isolated success/failure checks, refusal guards, and EXIT cleanup. Docker runtime path was not runnable locally due socket permissions. |
| M3 — CI wiring and validation | Complete locally | Added the dedicated Ubuntu job and all-target-branch PR filter; YAML/config/shell/static checks passed. Hosted run remains the live runtime evidence. |

## 3. Baseline Findings

- `.github/workflows/ci.yml` currently filters `pull_request` to `main`; push already covers `"**"`.
- `docker-compose.yml` already gates backend on healthy DB and `migrate` completion, but CI has no runtime Compose migration smoke.
- The Compose file requires root `.env` and `backend/.env`, uses fixed container names, binds host ports, and has a project-scoped `postgres_data` volume.
- Local `docker compose version` returned `Docker Compose version v5.1.4`.
- Local `docker info --format '{{.ServerVersion}}'` and `docker ps --format '{{.Names}} {{.Status}}'` both failed with `permission denied while trying to connect to the Docker API at unix:///var/run/docker.sock`. No container start was attempted.
- Existing CI is on `ubuntu-latest`, providing an isolated Docker host for the smoke test.
- Hindsight search/list were attempted for M44 and returned `ECONNREFUSED 127.0.0.1:9077`; no memory content informed this plan.

## 4. Files Changed

- `.github/workflows/ci.yml`
- `scripts/ci/compose-migration-gate-smoke.sh`
- `docs/ai-workflow/tasks/m44-compose-migration-gate-ci/{TASK_BRIEF.md,PLAN.md,STATUS.md}`

The task packet is ignored by the repository’s broad `docs/ai-workflow` ignore rule and must be explicitly included in the scoped milestone checkpoint.

## 5. Verification Log

| Check | Command | Result |
| --- | --- | --- |
| M43 worktree status | `git status --short --branch` in `/tmp/gridy-m43-release-migration-dns-safety` | Clean branch `fix/m43-release-migration-dns-safety`. |
| M43 tree | `git rev-parse HEAD^{tree}` | `8a6000932e6329c4677a27f747827d636852b6fc`. |
| CI/Compose inspection | `sed` of `.github/workflows/ci.yml` and `docker-compose.yml` | Current PR filter is `main`; migration service and backend success dependency are present. |
| Compose CLI | `docker compose version` | `Docker Compose version v5.1.4`. |
| Docker engine | `docker info --format '{{.ServerVersion}}'` | Failed: permission denied connecting to `/var/run/docker.sock`; no services started. |
| Container inventory | `docker ps --format '{{.Names}} {{.Status}}'` | Failed for the same socket permission; no changes were made. |
| Bash syntax | `bash -n scripts/ci/compose-migration-gate-smoke.sh` | Exit 0; no output. |
| Workflow parse and assertions | Python/PyYAML `BaseLoader` parse of `.github/workflows/ci.yml`; assertions for `pull_request.branches: ["**"]`, read-only permissions, a 15-minute job timeout, and the smoke job command | `Workflow YAML parsed; all-branch PR trigger, read-only permissions, 15-minute timeout, and smoke job verified.` |
| Compose configuration | Python wrapper created temporary test-only root/backend env files, ran `docker compose config --format json` for base and failure override, asserted the migration command and both dependency conditions, then removed the files | `Compose base and failing-migration override configurations validate; migration and backend dependency gates are preserved.` No services were started. |
| Environment-file refusal | Python wrapper wrote a temporary sentinel `.env`, invoked the smoke script, checked nonzero refusal and byte-for-byte preservation, then removed only its sentinel | `Preflight guard preserved a pre-existing env file`. |
| Docker-unavailable safety | The smoke script was invoked with clean env paths; it stopped at `docker info` due socket permissions and left both env paths absent | `Docker-unavailable path exited before creating env files or starting services.` |
| Smoke script whitespace | `grep -nE '[[:blank:]]$' scripts/ci/compose-migration-gate-smoke.sh` | No matching lines. |
| Compose CLI flags | `docker compose ps --help | rg -n -- '--all|--quiet'` | Both `--all` and `--quiet` are supported by the installed Compose CLI. |
| Diff hygiene | `git diff --check && git diff --cached --check` | Exit 0; no output. |

## 6. Decisions and Deviations

- The live success/failure Compose smoke runs in hosted CI because local Docker socket access is unavailable. Local checks will not be reported as container execution.
- A native PR-wide `"**"` filter is applied so PRs targeting branches other than `main` can receive checks.
- No change to `docker-compose.yml` is planned; the smoke consumes the M43 migration gate as configured.
- Hindsight search, list, and initiative capture were attempted before implementation; all returned `ECONNREFUSED 127.0.0.1:9077`, so no Hindsight content informed the implementation.

## 7. Remaining Work

- [x] Implement isolated smoke script and its success/failure assertions.
- [x] Add the smoke job and all-target-branch PR trigger.
- [x] Run local static/config checks and record actual results.
- [ ] Inspect hosted workflow status after publishing; report absent/pending runs honestly.
- [ ] Commit and open a stacked PR targeting M43; do not merge or deploy.
