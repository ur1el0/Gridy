# Plan: M50 — Private Container Registry and Key Vault Foundation

## 1. Plan Overview
- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target Branch:** `infra/m50-private-acr-keyvault`
- **Base:** M49 local checkpoint `4d5a3abe2c96c4f11363fc12952816e3826c31d5`, tree `c1d87e3911e7825f424b4d2b4c8bbac0dc178885`
- **PR Base:** `infra/m49-azure-pilot-foundation`
- **Worktree:** `/tmp/gridy-m50-private-acr-keyvault`
- **Complexity:** Medium

## 2. Milestones

### M1 — Contract, baseline, and current platform requirements
1. Confirm M49 is clean, PR #180 remains open, and this worktree is isolated from the primary checkout.
2. Read the M42 gates, M49 template/README/checker/workflow, and Microsoft Learn requirements for ACR Private Link, Key Vault private access, private DNS, and Bicep resource contracts.
3. Record current CLI/compiler availability and the exact no-cloud boundary in STATUS.
4. Keep all resource values required at deployment time; do not create sample parameters.

**Validation:** inspect Git status/worktree; review current official Microsoft Learn sources; check `command -v az` and `command -v bicep`.

### M2 — Extend the Bicep foundation
1. Add a separate private-endpoint subnet with required name/address-prefix parameters, no delegations, and `privateEndpointNetworkPolicies: 'Disabled'`.
2. Add a Premium-only ACR with required global name, tags, `adminUserEnabled: false`, `publicNetworkAccess: 'Disabled'`, and no registry credentials or content.
3. Add a Key Vault with required name and tenant ID, Standard SKU, RBAC authorization, soft delete, purge protection, a required bounded retention value, and `publicNetworkAccess: 'Disabled'`.
4. Add exact ACR and Key Vault private DNS zones and VNet links with registration disabled.
5. Add one private endpoint per service and a corresponding private DNS zone group per endpoint. Use the documented `registry` and `vault` group IDs.
6. Add no app, image, secret value, identity, role assignment, output, or Azure deployment operation.

**Validation:** compile with Bicep v0.47.16 when available; otherwise defer compile completion to the existing hosted compile-only job. Inspect every resulting resource and dependency.

### M3 — Strengthen compile contract and operator documentation
1. Expand `check-azure-pilot-foundation.py` to assert required parameters/no defaults, exact new resource types, ACR/KV security properties, subnet policies, private endpoint service/subresource relationships, DNS zone/link/zone-group relationships, and prohibited resource classes/outputs.
2. Ensure the checker fails closed on malformed ARM resource shapes and does not rely on a permissive subset test.
3. Update the README to describe the private ACR/KV, Premium tier requirement and cost implication, private runner requirement for image publication, future identity/RBAC work, and the private Key Vault's lack of secret data.
4. Retain the compile-only job's pinned compiler and read-only permissions. Do not add Azure authentication or an online deployment check.

**Validation:** run the Python checker on a locally compiled template if Bicep exists; otherwise validate checker syntax and static workflow contract locally, then require hosted compile/check. Parse the workflow and confirm its permissions and steps.

### M4 — Review and delivery
1. Run changed-file whitespace checks and `git diff --check`; inspect the full diff for scope, defaults, secrets, identifiers, and unexpected resource types.
2. Confirm no migrations, application source, package/dependency files, or primary-worktree files changed.
3. Commit the scoped result locally, publish an equivalent commit whose parent is the current remote M49 branch head, and verify the remote tree matches the local tree.
4. Open a PR targeting `infra/m49-azure-pilot-foundation`; inspect its checks and record exact delivery details.
5. Do not merge, deploy, authenticate to Azure, validate against an Azure subscription, or perform provider operations.

## 3. Comprehensive Verification
- [ ] `command -v az` / `command -v bicep` availability recorded.
- [ ] Pinned Bicep compilation passes locally or via hosted compile-only CI.
- [ ] Compiled ARM checker passes and verifies the full resource/security contract.
- [ ] Workflow YAML parses; compiler remains pinned; job has read-only contents permission and no Azure credentials/actions/operations.
- [ ] `git diff --check` and staged-diff check pass.
- [ ] No application tests are needed because runtime source is not changed; existing CI results are recorded, without claiming unrelated checks prove Azure behavior.
- [ ] PR branch tree equals the completed local tree and PR base is M49.

## 4. Risks and Rollback
- Premium ACR and private endpoints have ongoing cost. The template reports no final cost; estimate only after region, usage, and budget decisions.
- A private ACR cannot be reached by a standard public hosted CI runner. Keep image build/push disabled until a separately designed private runner or approved private build service exists.
- A Key Vault with public access disabled must be accessed through a private endpoint/DNS path; no client identity or role assignment is included yet.
- ACR names and Key Vault names are globally scoped/unique and can be unavailable at deployment even if Bicep compiles.
- Rollback for this compile-only milestone is reverting the scoped branch/commit. No cloud resources are created.

## 5. Architectural Decisions and References
- Reuse M49's VNet and private DNS model, adding a distinct subnet for endpoints instead of placing them on delegated workload/database subnets.
- ACR Private Link requires Premium, its standard private zone is `privatelink.azurecr.io`, and the registry subresource is `registry`.
- Key Vault's private zone is `privatelink.vaultcore.azure.net`; RBAC, soft delete, purge protection, and disabled public access are explicit.
- References reviewed 2026-10-11:
  - [ACR Private Link](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-private-link)
  - [Key Vault Private Link](https://learn.microsoft.com/en-us/azure/key-vault/general/private-link-service)
  - [Key Vault network security](https://learn.microsoft.com/en-us/azure/key-vault/general/how-to-azure-key-vault-network-security)
  - [Key Vault Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.keyvault/vaults)
  - [Private Endpoints Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.network/privateendpoints)
  - [Private DNS zone groups Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.network/2024-05-01/privateendpoints/privatednszonegroups)
  - [Private Endpoint network policies](https://learn.microsoft.com/en-us/azure/private-link/disable-private-endpoint-network-policy)
