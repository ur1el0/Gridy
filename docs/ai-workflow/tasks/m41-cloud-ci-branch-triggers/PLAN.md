# Implementation Plan: M41 — Cloud CI for Development Branches

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target Branch:** `chore/m41-cloud-ci-branch-triggers`
- **Base:** M40 merged head `84e94348a9503a22418afb3ba8b93298c0814cba` (current `main` is a clean descendant according to GitHub comparison).
- **Complexity:** Low
- **Scope:** One GitHub Actions workflow plus this task packet.

## 2. Milestones

### Milestone 1: Baseline and Task Contract

- **Objective:** Record current trigger behavior, job inventory, base commit, and acceptance criteria before editing the workflow.
- **Files:** This task packet.
- **Actions:**
  1. Confirm clean isolated worktree and preserve the primary checkout.
  2. Record the existing `main`-only push and pull-request triggers and all five jobs.
  3. Record current M40 post-merge CI evidence and risks.
- **Validation:** `git status --short --branch`; inspect `.github/workflows/ci.yml`; verify task packet and diff hygiene.
- **Expected Outcome:** A complete, bounded contract exists before workflow edits.

### Milestone 2: Workflow Trigger Configuration

- **Objective:** Enable cloud CI for development pushes and manual runs without changing job behavior.
- **Files:** `.github/workflows/ci.yml`.
- **Actions:**
  1. Expand `push.branches` from only `main` to `"**"`, matching every branch while leaving tag behavior excluded by the branch filter.
  2. Add `workflow_dispatch:` as a manual trigger.
  3. Preserve `pull_request.branches: ["main"]`, permissions, all five jobs, commands, and job dependencies exactly.
- **Validation:** Review the workflow diff line-by-line; run available workflow/YAML syntax validation.
- **Expected Outcome:** Branch pushes and manual dispatch run the existing full CI; PR checks remain scoped to PRs targeting `main`.

### Milestone 3: Verification and Delivery

- **Objective:** Confirm the scoped diff, record actual verification, and deliver the branch for cloud execution.
- **Files:** Workflow and task `STATUS.md`.
- **Actions:**
  1. Run a workflow syntax checker if available; otherwise use an installed YAML parser and inspect the GitHub Actions event structure.
  2. Run `git diff --check` and inspect `git diff --stat`, `git diff`, staged state, and worktree state.
  3. Confirm no application, schema, dependency, permission, secret, or deployment changes.
  4. Update `STATUS.md` with actual command outputs and any cloud workflow run result.
  5. Commit and push the scoped branch; do not create a PR or deploy.
- **Validation:** `actionlint .github/workflows/ci.yml` when installed; YAML parse/structure check; `git diff --check`; inspect GitHub Actions run after push.
- **Expected Outcome:** A narrow branch with an auditable local validation record and, if the push succeeds, a cloud run result.

## 3. Verification Plan

- [ ] Workflow syntax check (`actionlint` if present; otherwise installed YAML parser and structural inspection).
- [ ] `git diff --check`.
- [ ] Verify the five job IDs and their definitions are unchanged from base.
- [ ] Verify staged file list is empty before the intended scoped commit.
- [ ] Verify branch push and cloud run status; record exact run identifier and job conclusions.
- [ ] Confirm no PR or deployment was created.

## 4. Risks, Dependencies, and Rollback

- **Dependency:** GitHub Actions must be enabled for the repository; the workflow file must be on `main` for manual dispatch to be available.
- **Cost:** Every pushed branch will run the existing CI matrix; pushes on branches with open PRs can cause a duplicate run.
- **Rollback:** Revert the single workflow trigger change. No application or database rollback is required.
- **Production safety:** No deployment jobs or production environment operations are included.

## 5. Plan Amendments

- None at plan approval. If repository or GitHub behavior contradicts the event contract, record the evidence in `STATUS.md` and make only a minimal documented adjustment.
