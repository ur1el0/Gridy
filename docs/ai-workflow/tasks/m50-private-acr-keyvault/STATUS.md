# Status — M50 Private Container Registry and Key Vault Foundation

## 1. Executive Summary
- **Task ID:** m50-private-acr-keyvault
- **State:** In progress — Bicep, contract checker, and README updated; hosted Bicep compilation is pending
- **Current milestone:** M1–M3 implemented; M4 verification/delivery in progress
- **Branch:** infra/m50-private-acr-keyvault
- **Worktree:** /tmp/gridy-m50-private-acr-keyvault
- **Local base:** M49 checkpoint 4d5a3abe2c96c4f11363fc12952816e3826c31d5 (tree c1d87e3911e7825f424b4d2b4c8bbac0dc178885)
- **Remote PR base:** M49 branch infra/m49-azure-pilot-foundation, PR #180; remote head at baseline 8da9d88cf8ce0e5cad60f72d35117152f56e0ef0, same content tree as the local base

## 2. Progress
| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Contract and baseline | Complete | M49 content tree is the parent baseline. Work is isolated under /tmp. |
| M2 — Bicep private registry/Key Vault resources | Implemented | Added a dedicated endpoint subnet, private Premium ACR, private Key Vault, two endpoints, two private DNS zones, links, and zone groups. |
| M3 — Checker and README | Implemented | Expanded the compiled ARM contract checker and documented network, access, cost, runner, and deployment gates. |
| M4 — Verification and delivery | In progress | Local static/source/workflow checks pass. Local Bicep is unavailable; the hosted compile-only job is required. No M50 commit, push, or PR yet. |

## 3. Decisions and Constraints
- M50 extends the M49 candidate only. M42's subscription/budget, region/data-residency/privacy, workload sizing/quota, RPO/RTO, and operational ownership gates remain unresolved.
- No Azure login/account/subscription access, ARM provider validation, what-if, deployment, image push, secret write, or live-resource operation is in scope.
- Microsoft documents ACR Private Link as a Premium-tier feature. The template requires Premium, disables the admin user, anonymous pull, trusted-service bypass, and public network access.
- The Key Vault uses Standard SKU, Azure RBAC, soft delete, purge protection, and required 7–90 day retention. It is empty: there are no secret values, identities, or role assignments.
- ACR and Key Vault use separate private endpoints in a dedicated non-delegated subnet. DNS zones are privatelink.azurecr.io and privatelink.vaultcore.azure.net and are linked to the VNet with registration disabled.
- A public hosted CI runner has no VNet path to the private ACR. This task does not create or push images; a future task must choose a private runner or approved private build path.
- Key Vault public access is disabled. Microsoft documents a trusted-service exception to the private-endpoint traffic rule; no secret data exists in this milestone.
- Hindsight search/list/capture were attempted; the local Hindsight service refused connections at 127.0.0.1:9077. No Hindsight content was available.
- Microsoft Learn documentation accessed 2026-10-11. Source links are recorded in PLAN.md and the infrastructure README.

## 4. Files Changed or Created
- docs/ai-workflow/tasks/m50-private-acr-keyvault/TASK_BRIEF.md
- docs/ai-workflow/tasks/m50-private-acr-keyvault/PLAN.md
- docs/ai-workflow/tasks/m50-private-acr-keyvault/STATUS.md
- infra/azure/pilot-foundation/main.bicep
- infra/azure/pilot-foundation/README.md
- scripts/ci/check-azure-pilot-foundation.py

The existing CI workflow was reviewed and requires no change: its pinned compile-only job already runs the expanded checker.

## 5. Verification Log
| Check | Command / evidence | Result |
| --- | --- | --- |
| Isolated baseline | git worktree add -b infra/m50-private-acr-keyvault /tmp/gridy-m50-private-acr-keyvault HEAD | PASS: isolated worktree created at local M49 checkpoint; main checkout was not used for edits. |
| M49 delivery state | GitHub PR #180 and workflow run 38143644178 | PASS: PR remains open/unmerged; remote base head is 8da9d88cf8ce0e5cad60f72d35117152f56e0ef0 with content tree c1d87e3911e7825f424b4d2b4c8bbac0dc178885; all eight jobs completed successfully. |
| Local compiler availability | command -v az; command -v bicep | UNAVAILABLE: neither Azure CLI nor standalone Bicep is installed. No Azure account commands were run. |
| Bicep source markers | Python assertions over main.bicep | PASS: 19 declared resource instances; required private-network/security properties, ACR registry/vault subresources, and no-default/no-app/no-role/no-secret scope markers are present. The first ad-hoc assertion expected 18 declarations; the corrected check counted 19 (M49's 8 plus 11 M50 additions). |
| Checker syntax | python3 -m py_compile scripts/ci/check-azure-pilot-foundation.py | PASS. |
| Existing CI workflow | PyYAML BaseLoader parse plus assertions on azure-bicep-compile | PASS: pinned Bicep v0.47.16; contents permission read-only; no Azure login, deployment, or what-if command. |
| Azure operation/secret scan | rg patterns for azure/login, id-token: write, az deployment, what-if, AZURE_CREDENTIALS, secrets:set, az acr login, and docker push over workflow and checker | PASS: no matches. |
| Diff hygiene | git diff --check | PASS: clean. |
| Staged state | git diff --cached --name-only | PASS: empty before checkpoint. |
| Primary checkout | git -C /home/dokja/vsc-fedora/all/Projects/django-projects/Gridy status --short --untracked-files=no | PASS: no tracked primary-checkout changes. Protected untracked environment/logo assets were not modified. |

## 6. Remaining Work and Unverified Items
- [ ] Force-add only the three M50 task documents (the repository ignores docs/ai-workflow) and commit the scoped M50 result.
- [ ] Publish an equivalent commit whose parent is the latest remote M49 branch head; compare the resulting Git tree to the local M50 tree.
- [ ] Open a PR targeting infra/m49-azure-pilot-foundation and inspect the hosted checks.
- [ ] Require hosted Bicep v0.47.16 compilation and contract checker to pass before marking M50 complete. Fix any compile/check failures in focused commits.
- Azure provider availability, quota, cost, unique resource-name availability, endpoint provisioning/approval, DNS resolution, data-plane access, and deployment behavior remain unverified by design.
