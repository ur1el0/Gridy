# Status — M54 ACR Repository Parameter Preflight

## 1. Executive Summary

- **Task ID:** `m54-acr-repository-preflight`
- **State:** Implementation and local verification complete; hosted CI and delivery pending
- **Current milestone:** M1–M3 complete; M4 in progress
- **Branch:** `infra/m54-acr-repository-preflight`
- **Worktree:** `/tmp/gridy-m54-acr-repository-preflight`
- **PR base:** `infra/m53-acr-publisher-rbac` (PR #184, open and unmerged)
- **Base local commit/tree:** `7d50e11b44d21ca50c4379b5f2cb632b7e6c56b9` / `9b99912759060e093ed5fdee2ace9dceb29c5980`
- **Safety boundary:** no Azure authentication, account/resource query, deployment, role assignment, image push, or production operation.

## 2. Progress

| Milestone | Status | Notes |
| --- | --- | --- |
| M1 — Parameter contract and baseline | Complete | M53 required parameters, no-default contract, CI compile job, README constraints, M53 PR/base, and official syntax references reviewed. |
| M2 — Offline preflight implementation | Complete | Added stdlib CLI, strict JSON/input validation, safe diagnostics, and host-like prefix rejection. |
| M3 — CI tests and README usage | Complete | Added 15 stdlib tests, dedicated unprivileged Python 3.12 job, and documented exact preflight command. |
| M4 — Review and delivery | In progress | Local checks pass; scoped commit, remote branch, stacked PR, and hosted CI inspection remain. |

## 3. Baseline Decisions

- The preflight will read only the two required literal string values from an ARM JSON parameters file. No sample deployment parameters or names will be committed.
- Repository syntax will follow a Docker-compatible lowercase slash-delimited grammar, limited to 255 characters. A first component containing a dot or equal to `localhost` before `/` is rejected to avoid host/repository ambiguity; this conservatively excludes some valid dotted namespaces.
- Backend and frontend repository names must be distinct.
- The tool will reject malformed/duplicate JSON keys and avoid printing supplied values or other parameter-file contents.
- The check is offline and syntax-only; provider availability, uniqueness, Azure policy, and M42 governance remain unverified and gated.
- Python implementation follows a test-first sequence; the plan was amended to run the new test module before writing the validator.

## 4. Verification Log

| Check | Command / evidence | Result |
| --- | --- | --- |
| Hindsight list/search | Hindsight knowledge page list and M53/M54 preflight search | UNAVAILABLE: the local service at `127.0.0.1:9077` refused both connections. No Hindsight claims informed this task. |
| Primary checkout tracked status | `git -C /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy status --short --untracked-files=no` | PASS: no tracked modifications before M54 planning. |
| M53 branch baseline | `git status --short --branch && git rev-parse HEAD^{tree}` in `/tmp/gridy-m54-acr-repository-preflight` | PASS: clean M54 branch created from M53 checkpoint tree `9b99912759060e093ed5fdee2ace9dceb29c5980`. |
| M53 PR and CI | GitHub PR #184 and workflow run #429 | PASS: PR open/unmerged on M53; all eight jobs and Vercel status passed for the M53 status checkpoint. |
| ACR repository syntax | Microsoft Learn ACR concepts and Docker Distribution reference source | PASS: reviewed current documented characters/namespaces and Docker-compatible component grammar/255-character limit. |
| Plan/source boundary | `git status --short --branch` and task-plan review | PASS: only the three M54 task packet documents created; no implementation source edited. |
| Hindsight initiative capture | `hindsight_capture_initiative` for M54 | UNAVAILABLE: local Hindsight at `127.0.0.1:9077` refused the request. |
| Test-first baseline | `python3 -m unittest discover -s scripts/ci -p 'test_acr_repository_parameters.py'` | EXPECTED RED: test discovery failed to import the not-yet-created validator module. |
| First validator test run | Same command after initial implementation | FAIL: 13 tests passed; host-like repository path `registry.azurecr.io/api` was accepted as a valid namespace. Plan amended to reject dotted first path components and `localhost` before `/`. |
| CI job design | Workflow review | Plan amended to run the stdlib tests in a dedicated Python 3.12 job rather than inside the Azure CLI compile container; no deployment permission is added. |
| Final validator tests | `python3 -m unittest discover -s scripts/ci -p 'test_acr_repository_parameters.py'` | PASS: 15 tests. |
| Python syntax compilation | `python3 -m py_compile scripts/ci/check_acr_repository_parameters.py scripts/ci/test_acr_repository_parameters.py` | PASS. |
| Workflow YAML parse | `python3 -c 'import yaml; yaml.safe_load(open(".github/workflows/ci.yml", encoding="utf-8")); print("PASS: workflow YAML parses")'` | PASS using installed PyYAML; a Ruby YAML parser was unavailable. |
| Scoped whitespace scan | Python scan of the two scripts, CI workflow, README, and task packet | PASS: no trailing whitespace found. |
| Diff hygiene | `git diff --check` | PASS: clean. |
| Azure operation boundary | Command and workflow review | PASS: no Azure login, query, `what-if`, deployment, role assignment, image push, or production action was run or added. |
| Primary checkout boundary | `git -C /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy status --short` | PASS: tracked worktree remains unchanged; existing untracked agent/environment/logo assets remain present and untouched. |

## 5. Planned Files

- `scripts/ci/check_acr_repository_parameters.py`
- `scripts/ci/test_acr_repository_parameters.py`
- `.github/workflows/ci.yml`
- `infra/azure/pilot-foundation/README.md`
- `docs/ai-workflow/tasks/m54-acr-repository-preflight/{TASK_BRIEF.md,PLAN.md,STATUS.md}`

## 6. Remaining Work

- [x] Implement the offline parameter preflight.
- [x] Add unit tests for positive, negative, boundary, and redaction cases.
- [x] Add a dedicated unprivileged CI test job and document the pre-deployment command.
- [ ] Commit the scoped M54 changes, publish a stacked branch and PR targeting M53, then inspect hosted CI.
- [x] Preserve untracked agent/environment/logo assets and keep all Azure approval gates closed.
