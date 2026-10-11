# Status — M55 Azure Pilot Network Parameter Preflight

## 1. Executive Summary

- **Task ID:** `m55-azure-network-parameter-preflight`
- **State:** Local implementation and verification complete; hosted CI and delivery pending
- **Current milestone:** M1–M3 complete; M4 in progress
- **Branch:** `infra/m55-azure-network-parameter-preflight`
- **Worktree:** `/tmp/gridy-m55-azure-network-parameter-preflight`
- **PR base:** `infra/m54-acr-repository-preflight` (PR #185, open and unmerged)
- **Base local commit/tree:** `9fec41114b8348be0803d617bb478a5271fc7163` / `0d8eb69566dac4bfe77e5acbdfd433c6765c299b`
- **Safety boundary:** no Azure authentication, account/resource query, deployment, image operation, or production operation.

## 2. Progress

| Milestone | Status | Notes |
| --- | --- | --- |
| M1 — Baseline and network contract | Complete | M54 helper, four Bicep network inputs, M42 limits, and current Microsoft networking constraints reviewed. |
| M2 — Offline validator and tests | Complete | Added a CIDR/network validator that reuses M54's duplicate-safe JSON and repository-name helpers; covers all four network rules and value-safe errors. |
| M3 — CI and README | Complete | Added 14 stdlib tests to the unprivileged Python 3.12 preflight job and documented the combined command, source-based constraints, and limits. |
| M4 — Review and delivery | In progress | Local review and checks are complete; commit, remote branch, stacked PR, and hosted verification pending. |

## 3. Baseline Decisions

- The command will validate the four network parameter values in the same ARM JSON file as M54 and also reapply M54's repository-name checks.
- The VNet and subnet ranges must be strict IPv4 CIDRs. The three subnets must fit within the VNet and not overlap one another.
- The workload-profile ACA subnet must be `/27` or larger in capacity; the PostgreSQL delegated subnet must be `/28` or larger in capacity. The ACA subnet must avoid the documented ACA reserved ranges.
- No actual parameter values will be created or selected. External connected-network overlap and all M42 business/provider gates remain open.
- Hindsight search was attempted and failed because local service `127.0.0.1:9077` refused the connection; no Hindsight claims informed this task.

## 4. Verification Log

| Check | Command / evidence | Result |
| --- | --- | --- |
| Hindsight search | Search M42 network gates and approved network decisions | UNAVAILABLE: local service at `127.0.0.1:9077` refused connection. |
| Hindsight initiative capture | Capture M55 network parameter preflight initiative before implementation | UNAVAILABLE: local service at `127.0.0.1:9077` refused connection. |
| M54 baseline | `git status --short --branch && git rev-parse HEAD HEAD^{tree}` in the M55 worktree | PASS: clean branch based on M54 local checkpoint/tree. |
| Network parameter contract | `rg`/source inspection of `infra/azure/pilot-foundation/main.bicep` | PASS: VNet prefix and three subnet prefixes are required string parameters. |
| Microsoft constraints | Official Microsoft Learn networking pages, reviewed 2026-10-11 | PASS: source references and `/27`, `/28`, subnet overlap/containment, and ACA reserved-range constraints recorded in TASK_BRIEF.md. |
| Baseline worktree | `git status --short --branch` | PASS: clean before task packet creation; primary checkout remains untouched. |
| Test-first baseline | `python3 -m unittest discover -s scripts/ci -p 'test_azure_pilot_parameters.py' -v` | EXPECTED RED: test collection failed because `check_azure_pilot_parameters` had not yet been implemented. |
| First validator run | Same M55 test command after initial implementation | FAIL: eight reserved-range subtests stopped earlier at subnet containment because the synthetic fixture placed other subnets outside the VNet; fixtures were corrected so each reserved-range case reaches the intended assertion. |
| M55 validator tests | `python3 -m unittest discover -s scripts/ci -p 'test_azure_pilot_parameters.py' -v` | PASS: `Ran 14 tests in 0.016s` / `OK`, including the added success-path CLI redaction assertion. |
| M54 regression tests | `python3 -m unittest discover -s scripts/ci -p 'test_acr_repository_parameters.py' -v` | PASS: `Ran 15 tests in 0.009s` / `OK` after factoring reusable strict JSON/string/repository validation helpers. |
| Python syntax | `python3 -m py_compile scripts/ci/check_acr_repository_parameters.py scripts/ci/check_azure_pilot_parameters.py scripts/ci/test_azure_pilot_parameters.py` | PASS: exit 0, no output. |
| CI workflow syntax | `python3 -c 'import yaml; yaml.safe_load(open(".github/workflows/ci.yml", encoding="utf-8")); print("PASS: workflow YAML parses")'` | PASS: `PASS: workflow YAML parses`. |
| Tracked diff hygiene | `git diff --check` | PASS: exit 0, no output. |
| Scoped whitespace scan | Python scan of both validator scripts, new tests, workflow, README, and all three M55 task files | PASS: `PASS: no trailing whitespace`. |
| Scope and safety inspection | `git status --short`, `git diff --name-only`, and review of the scoped diff | PASS: only planned workflow, README, shared preflight helper, and two new scripts are changed; no Azure action, migration, or dependency change. |

## 5. Planned Files

- `scripts/ci/check_acr_repository_parameters.py` (M55 adds reusable public parsing/validation helpers without changing CLI behavior)
- `scripts/ci/check_azure_pilot_parameters.py`
- `scripts/ci/test_azure_pilot_parameters.py`
- `.github/workflows/ci.yml`
- `infra/azure/pilot-foundation/README.md`
- `docs/ai-workflow/tasks/m55-azure-network-parameter-preflight/{TASK_BRIEF.md,PLAN.md,STATUS.md}`

## 6. Remaining Work

- [x] Add and run the test-first network preflight suite.
- [x] Implement strict offline IPv4/CIDR validation and value-safe diagnostics.
- [x] Add the unprivileged Python CI job and document usage/limits.
- [ ] Commit and publish the stacked PR, then inspect hosted checks.
- [x] Preserve M42 gates, untracked environment/logo files, and the primary checkout.
