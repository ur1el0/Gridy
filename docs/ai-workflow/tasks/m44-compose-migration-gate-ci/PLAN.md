# M44 Implementation Plan — Compose Migration Gate CI Smoke Test

## 1. Overview

- **Associated brief:** `TASK_BRIEF.md`
- **Branch:** `test/m44-compose-migration-gate-ci`
- **Base:** M43 saved tree; PR #174 remains open and unmerged.
- **Complexity:** Medium
- **Work mode:** Codex plans, implements, verifies, reviews, and records a local checkpoint. Publish the branch and open a stacked PR targeting `fix/m43-release-migration-dns-safety`; do not merge or deploy.

## 2. Milestones

### M1 — Baseline and task contract

1. Confirm the M43 tree, the clean isolated checkout, current Compose migration dependencies, CI branch filters, and environment-file requirements.
2. Record that the local Docker daemon is inaccessible and that live Compose execution must be evidenced by hosted CI.
3. Capture this initiative in Hindsight before source implementation; record any Hindsight service failure without blocking code work.

**Validation:** `git status --short --branch`; inspect `.github/workflows/ci.yml` and `docker-compose.yml`; `docker compose version`; `docker info --format '{{.ServerVersion}}'`.

### M2 — Disposable migration-gate smoke script

1. Add `scripts/ci/compose-migration-gate-smoke.sh`.
2. Require a clean runner: abort if root/backend `.env` already exists or any fixed Compose container names are present. Use a unique project name.
3. Create minimal transient local test env files and a temporary Compose override; do not echo secret values.
4. Success case: build/start only `backend` and dependencies, verify the migration container exits 0 and the API health endpoint returns 200.
5. Tear down that project and volume. Failure case: override only the migration command to exit 42, require Compose startup to fail, verify the migration exit code and that no backend is running.
6. On every exit, tear down only the named project and remove only the temporary files created by this script.

**Validation:** `bash -n scripts/ci/compose-migration-gate-smoke.sh`; static checks that the script guards existing env files/containers and uses a unique project; run the smoke only when Docker socket access is available. This environment currently denies socket access.

### M3 — CI wiring and full validation

1. Change `.github/workflows/ci.yml` so `pull_request` branch matching covers all target branches (`"**"`), retaining current push and manual triggers.
2. Add a dedicated `compose-migration-gate` Ubuntu job that checks out the branch and runs the smoke script; grant no write permissions or secrets.
3. Validate workflow YAML and verify the job command and pull request filter. Validate rendered Compose configuration using temporary env files only when the expected paths are absent.
4. Run `git diff --check`, review the complete diff and ensure no runtime/schema/dependency/provider changes.
5. Update this `STATUS.md` with exact output. Commit the scoped task checkpoint, publish to GitHub, and open the stacked PR against M43 without waiting for merge.

**Validation commands:**

```bash
bash -n scripts/ci/compose-migration-gate-smoke.sh
python -c 'import yaml; yaml.load(open(".github/workflows/ci.yml"), Loader=yaml.BaseLoader)'
docker compose config --format json  # using temporary env files only if absent, then removing them
git diff --check
git diff --cached --check
```

Hosted CI is the required live Compose execution evidence if local Docker remains unavailable. Do not claim a remote check passed until its result is observed.

## 3. Architectural Constraints

- No model/schema or migration changes.
- No new packages or runtime dependencies.
- No production database or provider migration execution.
- No changes to `.agents/`, `.codex/`, `.aws/`, credentials, logos, or the primary checkout.
- The smoke script must not clobber persistent local environment files or remove resources outside its unique Compose project.

## 4. Risks and Rollback

- Fixed Compose names and ports prevent concurrent use with an existing Gridy stack. The script checks fixed names and runs on an isolated hosted runner.
- If hosted Docker behavior differs from the rendered configuration, record the failing output and amend only this plan’s smoke implementation before publishing a final checkpoint.
- Roll back by reverting the CI workflow and script changes; no persistent database state is part of this milestone.

## 5. Plan Amendments

- None at baseline. Local Docker socket denial is an environment limitation already included in the verification strategy; it does not justify claiming the live smoke passed locally.
