# Implementation Plan: M40 - Local Demo Role Seeding Safety

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target Branch:** `fix/seed-users-command-safety`
- **Base:** `2ac904b`
- **Complexity:** Medium
- **Implementation owner:** Antigravity
- **Review owner:** Codex

The base branch already contains the initial command. This task hardens that implementation and verifies it; it is not a greenfield rewrite.

## 2. Milestone Breakdown

### Milestone 1: Baseline and Failure-Reproduction Tests

- **Objective:** Confirm current command behavior and encode the safety gaps before changing implementation.
- **Files:**
  - `backend/gridy_auth/tests_demo_seed.py`
  - `backend/gridy_auth/management/commands/seed_users.py` (inspection only initially)
  - `backend/gridy_auth/management/commands/demo_seed_safety.py`
- **Actions:**
  1. Record branch, base commit, status, and current relevant behavior in `STATUS.md`.
  2. Add focused failing tests for an unexpected username collision, a target barangay collision, and password leakage in output.
  3. Add a rollback test that forces a failure after provisioning starts and proves no partial rows remain.
  4. Confirm existing tests exercise explicit confirmation, DEBUG, remote-host, role, and idempotency behavior.
- **Validation:**
  ```bash
  DEBUG=True venv/bin/pytest backend/gridy_auth/tests_demo_seed.py -k SeedUsersCommandTests
  ```
- **Expected Outcome:** New tests reproduce the safety gaps; existing baseline failures are recorded exactly.

### Milestone 2: Safe and Atomic Provisioning

- **Objective:** Prevent unintended record mutation and partial fixture writes while preserving the local-only demo workflow.
- **Files:**
  - `backend/gridy_auth/management/commands/seed_users.py`
  - `backend/gridy_auth/tests_demo_seed.py`
- **Actions:**
  1. Keep `require_local_demo_database()` as the first command action, before any query that can write.
  2. Define the current seed manifest and any specifically supported legacy identity fingerprints in one auditable place.
  3. Preflight all target usernames, email identities, and barangay names; reject unexpected collisions before mutation.
  4. Protect existing non-seed Resident rows and their verification/evidence fields from `update_or_create` overwrites.
  5. Wrap accepted provisioning in `transaction.atomic()` so failures roll back the entire invocation.
  6. Preserve idempotency and intended role/barangay assignments for recognized seed-owned rows.
  7. Keep all seed records synthetic and create no proof media or public URLs.
- **Validation:**
  ```bash
  DEBUG=True venv/bin/pytest backend/gridy_auth/tests_demo_seed.py -k SeedUsersCommandTests
  ```
- **Expected Outcome:** Collision and injected-failure tests pass without changing unrelated rows or leaving partial data.

### Milestone 3: Credential Output and Developer Instructions

- **Objective:** Keep development login instructions useful while preventing command logs from disclosing credentials.
- **Files:**
  - `backend/gridy_auth/management/commands/seed_users.py`
  - `backend/gridy_auth/tests_demo_seed.py`
  - `README.md`
- **Actions:**
  1. Remove password values from all success and error output.
  2. Retain the agreed local demo password workflow unless implementation evidence requires changing it; document it as local-only and require the existing explicit confirmation flag.
  3. Add an assertion that captured command output does not contain the password.
  4. Keep unrelated README setup and seed instructions unchanged.
- **Validation:**
  ```bash
  DEBUG=True venv/bin/pytest backend/gridy_auth/tests_demo_seed.py -k SeedUsersCommandTests
  git diff --check
  ```
- **Expected Outcome:** Login instructions remain clear; command output contains no credential values.

### Milestone 4: Full Verification and Delivery

- **Objective:** Verify repository compatibility, record actual results, and deliver the isolated branch.
- **Files:** Task `STATUS.md` plus only the scoped implementation/docs files.
- **Actions:**
  1. Run the targeted seed command tests and relevant full backend test suite.
  2. Run Django system checks and migration drift check.
  3. Inspect the complete diff for data-safety, role scoping, credential leakage, migrations, dependencies, and accidental scope expansion.
  4. Record exact commands and actual outputs in `STATUS.md`.
  5. Confirm only intended files are staged; commit and push `fix/seed-users-command-safety` to origin. Do not open a PR or deploy.
- **Validation Commands:**
  ```bash
  DEBUG=True venv/bin/pytest backend/gridy_auth/tests_demo_seed.py
  DEBUG=True venv/bin/pytest backend
  DEBUG=True venv/bin/python backend/manage.py check
  DEBUG=True venv/bin/python backend/manage.py makemigrations --check --dry-run
  git diff --check
  git diff --cached --name-only
  git status --short --branch
  ```
- **Expected Outcome:** Checks pass or the exact blocker is documented; no migrations/dependencies are introduced; branch is pushed and remains PR-free.

## 3. Risks and Mitigations

- **Seed ownership is ambiguous for legacy records:** Only explicitly enumerated identity fingerprints may be treated as seed-owned. Reject unknown collisions before writing.
- **Partial database mutation:** Preflight first and use a transaction for provisioning.
- **Credential exposure:** Never print password values; retain local-only warnings and guard tests.
- **Policy drift around resident evidence:** Do not create evidence files or alter M37 rules. Preserve synthetic fixture behavior only for local demo data and describe it accurately.
- **Accidental persistent database use:** Verification must use test databases only; do not invoke the command against the configured development database.
- **Scope drift:** No migrations, dependency additions, infrastructure work, or modifications to adjacent seed commands.

## 4. Plan Amendments

Record any evidence-based changes here before implementing beyond the agreed scope. No amendment has been approved yet.
