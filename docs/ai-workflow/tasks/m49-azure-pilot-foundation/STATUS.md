# Status — M49 Azure Non-production Pilot Foundation

## 1. Executive Summary

- **Task ID:** `m49-azure-pilot-foundation`
- **State:** Complete — hosted Bicep compilation, static contract check, and all CI jobs pass; PR #180 is open and unmerged
- **Current milestone:** M1–M4 complete; Azure provider validation and deployment gates remain unverified
- **Branch:** `infra/m49-azure-pilot-foundation`
- **Worktree:** `/tmp/gridy-m49-azure-pilot-foundation`
- **Base:** M48 local checkpoint `e952762a171d8bfd9430063e9baa302eed907c8c`, tree `e049ab0a2f8bdb8b90f16de973dc9c44854169c5`
- **Implementer:** Codex (user-directed sole-agent mode)

## 2. Progress

| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Work contract and baseline | Complete | Confirmed clean isolated worktree and recorded the M42–M48 constraints and no-cloud boundary. |
| M2 — Parameter-required foundation | Implemented locally | Added parameter-required Bicep, safety contract checker, and architecture README; local Bicep compilation is not available in the current environment. |
| M3 — Compile-only CI and static checks | Complete | Hosted Bicep compilation and the compiled ARM safety contract pass on the latest branch head. |
| M4 — Self-review and delivery | Complete | Scoped commits are pushed, PR #180 is open against M48, and all eight hosted CI jobs pass. No merge, Azure authentication, provider validation, or deployment occurred. |

## 3. Decisions and Gates

- M49 is a technical template and compiler check, not authorization to deploy.
- Required parameters replace guesses for region, CIDRs, resource names, PostgreSQL version/SKU/storage/backup/HA, Log Analytics SKU/retention, ACA zone redundancy/workload profiles, and tags.
- A `@secure()` administrator password parameter is required, but no password value or parameter file is committed.
- The PostgreSQL Flexible Server is private-network only. The template has no public database access, Container App definitions, production hostname, DNS cutover, migration command, or Azure identity/deployment job. Its empty ACA environment follows the external frontend-edge mode in M42's candidate topology; this is not an application endpoint.
- The M42 gates remain unresolved: subscription and budget owner; acceptable region and resident-data location; legal/privacy/data-owner approval; RPO/RTO; source database compatibility and workload sizing; pilot operational owner. No region or SKU is selected in M49.
- CI is permitted to compile Bicep source only. Compilation does not query Azure or verify provider availability, quota, policy, subnet overlap, cost, data residency, or deployed behavior.
- **Plan amendment:** The template is limited to the workload-profile ACA networking model. Supporting consumption-only mode would require a materially different `/23` non-delegated subnet contract; the M49 template now requires a non-empty profile list and enforces the `/27` delegated subnet model rather than emitting conditional subnet shapes.
- Hindsight search, listing, and initiative capture were attempted; the local service refused connections at `127.0.0.1:9077`. No Hindsight content informed this task.
- Microsoft Bicep user-defined type syntax uses the optional marker after the type (`property: string?`); the first hosted compile identified the TypeScript-style `property?: string` spelling as invalid. See the [official Bicep user-defined types reference](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/user-defined-data-types).

## 4. Files Changed or Created

Planning packet and implementation:

- `docs/ai-workflow/tasks/m49-azure-pilot-foundation/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m49-azure-pilot-foundation/PLAN.md`
- `docs/ai-workflow/tasks/m49-azure-pilot-foundation/STATUS.md`
- `infra/azure/pilot-foundation/main.bicep`
- `infra/azure/pilot-foundation/README.md`
- `scripts/ci/check-azure-pilot-foundation.py`
- `.github/workflows/ci.yml`

## 5. Verification Log

| Check | Command / evidence | Result |
| --- | --- | --- |
| Worktree baseline | `git status --short --branch` | PASS: clean `infra/m49-azure-pilot-foundation` worktree at the recorded M48 checkpoint before the task packet was created. |
| Branch base tree | `git rev-parse HEAD^{tree}` | PASS: `e049ab0a2f8bdb8b90f16de973dc9c44854169c5`. |
| Protected primary checkout | Read-only inspection in the primary checkout | Not yet rechecked for final status; no primary-checkout writes are planned. |
| Hindsight | Search/list/capture | Unavailable: `ECONNREFUSED 127.0.0.1:9077`; no page content returned. |
| Azure documentation | Official Microsoft Learn pages accessed 2026-10-11 | Reviewed Bicep compile-only behavior, ACA workload-profile subnet requirements, PostgreSQL private networking/DNS, resource schemas, and secure parameter guidance. Source links are in `infra/azure/pilot-foundation/README.md`. |
| Bicep compiler availability | `command -v az`; `command -v bicep` | Neither Azure CLI nor standalone Bicep is installed locally. The exact compiler install/build/static check is assigned to the new hosted CI job; no Azure credentials are required by that job. |
| Bicep source contract | Python source assertions over `main.bicep` | PASS: resource-group target; 25 parameters with no defaults; secure PostgreSQL password; 8 declarations across 7 foundation resource types; no app or public database declaration. The first assertion attempt incorrectly expected 7 declarations; the corrected count assertion passed. |
| Python checker syntax | `python3 -c 'from pathlib import Path; compile(Path("scripts/ci/check-azure-pilot-foundation.py").read_text(), "scripts/ci/check-azure-pilot-foundation.py", "exec"); print("PASS: Python checker parses")'` | PASS: checker parses. |
| Workflow parse and permissions | Python `yaml.load(..., Loader=yaml.BaseLoader)` assertion for the new job | PASS: `azure-bicep-compile` exists, job permissions are `contents: read`, compiler version is pinned, and no Azure login, subscription, deployment, or `what-if` command appears. |
| Whitespace scan | Python trailing-whitespace scan over the 7 changed/new text files | PASS: no trailing spaces or tabs. |
| Git diff hygiene | `git diff --check && git diff --cached --check` | PASS: tracked and staged diff checks are clean. The first staged check found one extra blank line at the end of `main.bicep`; it was removed and the staged check reran clean. |
| Secret/auth boundary scan | `rg -n "azure/login|id-token: write|az deployment|what-if|AZURE_CREDENTIALS|postgres_password=[^$]" .github/workflows/ci.yml infra/azure/pilot-foundation scripts/ci/check-azure-pilot-foundation.py` | PASS: no credentials, Azure login, deployment, or workflow write-permission configuration found. Matches of command names in README describe intentionally prohibited future actions. |
| Primary checkout preservation | `git -C /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy diff --name-only` and `git -C /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy status --short --untracked-files=no` | PASS: no tracked primary-checkout modifications; pre-existing untracked agent/logo content remains in place. |
| First hosted compiler run | GitHub Actions run `38142576073`, job `Azure foundation Bicep compile` | FAIL: Bicep v0.47.16 reported BCP018 and BCP279 at `main.bicep(84,26)` for the optional type-property declaration. Corrected to `standbyAvailabilityZone: string?` in local commit `7040130`, published as remote commit `4b997ca`. |
| Follow-up compile/static run | GitHub Actions run `38142697125`, job `Azure foundation Bicep compile` | Bicep compilation passed after the syntax correction; the Python contract checker failed its secure-parameter type assertion. The checker now compares the ARM type spelling case-insensitively and reports the actual type on failure; hosted verification is pending. |
| Nested-resource compile/static run | GitHub Actions run `38142862806`, job `Azure foundation Bicep compile` | Bicep compilation and parameter assertions passed; the checker then raised `AttributeError: 'str' object has no attribute 'get'` while traversing a nested resource object. Updated `walk_resources` to support both object and array representations and added explicit shape errors; hosted verification is pending. |
| Provider-name compile/static run | GitHub Actions run `38142960368`, job `Azure foundation Bicep compile` | Bicep compilation, parameter checks, and nested-resource traversal passed; subnet delegation comparison failed because ARM preserved `Microsoft.App/environments` and `Microsoft.DBforPostgreSQL/flexibleServers` casing. The checker now case-folds service names before comparison; hosted verification is pending. |
| Final hosted CI run | GitHub Actions run `38143045439` | PASS: all eight jobs completed successfully: backend tests, frontend tests, mobile tests, frontend image, backend image, Compose migration gate smoke, PostgreSQL DNS reconnect smoke, and Azure foundation Bicep compile/static contract. Bicep log: `PASS: required parameters have no defaults; password is secure; private PostgreSQL/DNS and two delegated subnets are present; no outputs, app, or registry resources were compiled.` |

## 6. Remaining Work and Unverified Items

- [x] Implement Bicep resources and README.
- [x] Check local Azure CLI/Bicep availability; neither is installed. Local compile result is unavailable, not passed.
- [x] Run static source/workflow checks and diff hygiene locally.
- [x] Push scoped changes and record the hosted compile/static check result.
- [x] Record final changed paths, diff hygiene, source scan, PR/check results, and primary-worktree status.
- Azure subscription or provider validation is deliberately not attempted; no Azure login or deployment is authorized in this milestone.

## 7. Delivery Checkpoint

- **Latest implementation commit:** local `9bd8581cd8161cdf6d57bd2a63e8a988c38de01b`; remote `fecf9974ca954c956c59d9ca2e137c8e32882443`.
- **Tree:** local and remote content tree `e040a2a6aa035d831c117d50505b54559defb9a2`.
- **PR:** [#180](https://github.com/ur1el0/KapitBayan/pull/180), open and unmerged, targeting M48 branch `test/m48-postgres-dns-reconnect`.
- **Hosted CI:** run `38143045439` passed all eight jobs on the branch before this status-only checkpoint.
- **Scope:** no Azure account access, subscription inspection, ARM validation, `what-if`, image publication, resource deployment, or production change.
