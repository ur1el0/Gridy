# Task Brief: M41 — Cloud CI for Development Branches

## 1. Metadata

- **Task ID:** `m41-cloud-ci-branch-triggers`
- **Task Type:** CI workflow configuration
- **Target Components:** GitHub Actions / documentation
- **Lead, Implementer, Verifier:** Codex (user-directed sole-agent mode)
- **Reviewer:** Codex self-review
- **Branch:** `chore/m41-cloud-ci-branch-triggers`
- **Base:** M40 merged head `84e94348a9503a22418afb3ba8b93298c0814cba`
- **Current `main`:** `ad0347a1dbcd2c356f5dfc853062e394bd5c6241`; GitHub comparison reports it is a descendant of the base with zero changed files from the merge base.

## 2. Objective and Scope

- **Goal:** Run the existing full GitHub Actions CI workflow on development branch pushes and permit manual dispatch, while retaining pull-request validation against `main`.
- **Non-goals:** Do not add or remove CI jobs, change test commands or dependencies, configure branch protection, add deployment steps, add secrets, alter application code, or change production hosting.
- **Problem:** `.github/workflows/ci.yml` currently runs on pushes only to `main` and pull requests targeting `main`. A development branch pushed to GitHub receives no CI result until a PR is opened.
- **Expected outcome:** GitHub-hosted runners validate pushed development work without requiring the developer's laptop to remain online. This applies after the commit has reached GitHub; unpushed local work cannot run in cloud CI.

## 3. Current Behavior and Evidence

- `.github/workflows/ci.yml` currently declares `push.branches: ["main"]` and `pull_request.branches: ["main"]`.
- Existing jobs are `backend-tests`, `backend-image`, `frontend-tests`, `frontend-image`, and `mobile-tests`; M41 keeps them unchanged.
- The M40 post-merge GitHub Actions run `38126963093` completed successfully for all five jobs.
- The branch is based on M40 head `84e9434`. GitHub reports current `main` at merge commit `ad0347a`, with the M40 head as its merge base and no file changes between them.

## 4. Required Rules and Constraints

- Preserve `pull_request` validation targeting `main`.
- Keep workflow permissions read-only (`contents: read`) and do not add deployment or write permissions.
- Avoid branch naming gaps: configure push matching for all branch names, excluding tags. GitHub's `**` branch glob is intended for this.
- Keep the existing job definitions and their dependency relationships unchanged.
- No application, schema, dependency, secret, production, or deployment changes.
- Preserve the primary checkout and its unrelated untracked environment and logo files.

## 5. Observable Acceptance Criteria

1. **AC-1:** A push to any branch name, including `main`, matches the workflow; tag pushes do not match the branch filter.
2. **AC-2:** Pull requests targeting `main` continue to trigger the same workflow.
3. **AC-3:** `workflow_dispatch` is available for manual runs without adding write permissions or changing job behavior.
4. **AC-4:** The five existing job definitions, test/build commands, and dependency graph remain unchanged.
5. **AC-5:** Workflow syntax validates; `git diff --check` is clean; the diff contains no application, database, dependency, secret, or deployment changes.
6. **AC-6:** The branch is committed and pushed without opening a PR. Cloud run status is recorded if GitHub Actions starts successfully.

## 6. Relevant Files

- `.github/workflows/ci.yml`
- `docs/ai-workflow/tasks/m41-cloud-ci-branch-triggers/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m41-cloud-ci-branch-triggers/PLAN.md`
- `docs/ai-workflow/tasks/m41-cloud-ci-branch-triggers/STATUS.md`

## 7. Risks and Mitigations

- **More CI minutes:** Matching all branch pushes means every pushed branch can run the existing full matrix. Keep workflow contents unchanged and document this expected cost.
- **Duplicate runs after opening a PR:** A push to a branch with an open PR can trigger both `push` and `pull_request`. This is accepted to provide pre-PR validation; concurrency or job-skipping changes are outside scope.
- **Manual dispatch availability:** GitHub requires the workflow file to exist on the default branch for `workflow_dispatch` UI/API execution. The manual trigger becomes available after this workflow change reaches `main`.
- **Local versus cloud verification:** Static validation can run locally; actual cloud execution requires a GitHub branch push. No production deployment is involved.
