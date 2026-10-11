# Status — M53 Least-Privilege ACR Publisher Identity

## 1. Executive Summary

- **Task ID:** `m53-acr-publisher-rbac`
- **State:** In progress — M1–M3 implemented; pinned hosted Bicep/ARM verification and delivery pending
- **Current milestone:** M1–M3 complete; M4 pending
- **Branch:** `infra/m53-acr-publisher-rbac`
- **Worktree:** `/tmp/gridy-m53-acr-publisher-rbac`
- **PR base:** `infra/m52-private-image-publish-path` (PR #183, open and unmerged)
- **Base commit/tree:** local `5289f472fca6dedfdea59f78f5c899fd49464e5` / `09b5fbde9481c0b618ee98dee9df814c8318a633`; remote M52 head is `1c24d23c849690d93e143f9f54618e353c604098` with the same content tree.
- **Safety boundary:** no Azure login, subscription query, provider validation, `what-if`, deployment, identity assignment, federation, image publication, or production operation.

## 2. Progress

| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Baseline and ABAC contract | Complete | M52 PR and tree verified; Microsoft Writer role ID, data actions, ABAC repository condition, and Bicep role-assignment condition contract reviewed. Hindsight service unavailable. |
| M2 — Publisher identity and assignments | Implemented | Added one distinct publisher identity and two required exact-repository ABAC Writer assignments. No repository values/defaults, OIDC, workflows, or cloud operations were added. |
| M3 — ARM checker and README | Implemented | Checker now requires exact Writer role/identity/scope/condition/action coverage; README aligns with ADR 015's conditional GitHub-hosted VNet runner direction and describes the Writer boundary. |
| M4 — Self-review and delivery | Pending | No commit or remote branch/PR created yet. |

## 3. Verified Baseline and Decisions

- M52 PR #183 is open, unmerged, mergeable, and targets `infra/m51-managed-identity-rbac`; its remote head is `1c24d23c849690d93e143f9f54618e353c604098`.
- Local M52 candidate tree and remote M52 PR head tree are both `09b5fbde9481c0b618ee98dee9df814c8318a633`.
- Existing M51 identities remain separated: ACR image-pull reader and backend Key Vault secret reader.
- Repository names are not yet approved. The local CI image labels are not used as defaults.
- The proposed implementation uses one publisher identity and two exact-name ABAC Writer assignments, one per required repository input.
- The official Microsoft role reference lists four Writer data actions: repository metadata read/write and content read/write. Each assignment condition scopes all four to its exact repository parameter.
- Bicep parameter decorators support a non-empty constraint but not a regex for the full ACR repository-name grammar. No parameter values are selected; the future approved deployment preflight must validate lowercase Docker-compatible repository syntax before deploying the generated condition.
- The M52 README's prior private-runner guidance is stale relative to ADR 015's conditional GitHub-hosted VNet larger-runner preference; M53 will align it while preserving all approval gates.
- Primary checkout `/home/dokja/vsc-fedora/all/Projects/django-projects/Gridy` has no tracked modifications. Its pre-existing untracked `.agents/` skill files and JPEG logos were observed and will be preserved.

## 4. Verification Log

| Check | Command / evidence | Result |
| --- | --- | --- |
| Hindsight search/list/capture | Search and list M53 knowledge; capture initiative before implementation | UNAVAILABLE: all calls failed because local Hindsight at `127.0.0.1:9077` refused the connection. No Hindsight content informed this plan. |
| Isolated branch baseline | `git status --short --branch && git rev-parse HEAD && git rev-parse HEAD^{tree}` in `/tmp/gridy-m53-acr-publisher-rbac` | PASS: clean `infra/m53-acr-publisher-rbac`, base commit/tree match M52 checkpoint. |
| Protected primary tracked state | `git -C /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy status --short --untracked-files=no` | PASS: no tracked changes. Existing untracked agent/environment/logo content is present and preserved. |
| M52 PR/base | GitHub PR #183 metadata and M52 task packet | PASS: open, unmerged, mergeable; remote head/tree agree with local candidate tree. |
| Microsoft ACR Writer role | Official Microsoft Learn role directory and built-in Container roles page | PASS: role ID `2a1e307c-b015-4ebd-883e-5b7698a07328`; four data actions recorded in TASK_BRIEF.md. |
| Microsoft ABAC condition | Official ACR ABAC repository-permissions page | PASS: exact repository condition uses `StringEqualsIgnoreCase`; condition version 2.0; assignment scope stays at registry resource. |
| Azure CLI/Bicep availability | `command -v az || true; command -v bicep || true` | UNAVAILABLE locally: neither command produced a path. Azure authentication and provider operations remain out of scope. |
| Checker syntax | `PYTHONPYCACHEPREFIX=/tmp/m53-pycache python3 -m py_compile scripts/ci/check-azure-pilot-foundation.py` | PASS: Python checker compiled with no diagnostics. |
| Writer condition contract | In-memory calls to `validate_writer_condition` using representative ARM `format(...)` conditions and negative cases (wrong version, prefix operator, wrong parameter, and missing action) | PASS: valid shape accepted and all four malformed cases rejected. This is not a substitute for the pinned Bicep compilation. |
| Bicep source contract | One-off Python assertions over `main.bicep` | PASS: one publisher identity, two version-2.0 assignments, both required repository parameters with no defaults, and all four Writer action names present. |
| Local Bicep compile and compiled ARM checker | Existing pinned CI uses Bicep v0.47.16, then runs `check-azure-pilot-foundation.py` | PENDING hosted run; compiler unavailable locally. |
| Diff hygiene | `git diff --check` | PASS: clean. |

## 5. Changed Files

Planning and implementation files:

- `docs/ai-workflow/tasks/m53-acr-publisher-rbac/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m53-acr-publisher-rbac/PLAN.md`
- `docs/ai-workflow/tasks/m53-acr-publisher-rbac/STATUS.md`
- `infra/azure/pilot-foundation/main.bicep`
- `infra/azure/pilot-foundation/README.md`
- `scripts/ci/check-azure-pilot-foundation.py`

## 6. Remaining Work

- [x] Record local compiler/CLI availability.
- [x] Implement M2 publisher identity and exact repository-conditioned writer roles.
- [x] Implement M3 fail-closed ARM checking and README correction.
- [ ] Run actual local syntax/static/hygiene checks and hosted Bicep compile/ARM contract.
- [ ] Commit and push the scoped M53 branch; verify matching content tree.
- [ ] Open PR targeting M52 and inspect final CI; leave unmerged.
- [ ] Reconfirm protected primary checkout and untracked assets are preserved.
