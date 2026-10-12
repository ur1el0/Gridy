# Task Brief: M51 — Managed Identity and Least-Privilege Access Foundation

## 1. Metadata

- **Task ID:** `m51-managed-identity-rbac`
- **Task type:** Azure infrastructure foundation
- **Writer / implementer / reviewer:** Codex (user-directed sole-agent mode)
- **Target branch:** `infra/m51-managed-identity-rbac`
- **PR base:** `infra/m50-private-acr-keyvault` (M50 PR #181; remains unmerged)
- **Worktree:** `/tmp/gridy-m51-managed-identity-rbac`
- **Base tree:** M50 candidate content tree `f5a947d204c917de05e3f161dbeca42bb8cfdbf8`

## 2. Objective and Scope

Extend the M49–M50 resource-group-scoped Bicep candidate with separate user-assigned managed identities and resource-scoped Azure RBAC assignments:

1. A Container Apps image-pull identity receives read-only image-pull permission on the private ACR.
2. A backend API runtime identity receives Key Vault secret-read permission on the private Key Vault.

Use the current ACR ABAC repository-permissions mode explicitly and assign the ABAC-compatible `Container Registry Repository Reader` role. Do not assign catalog-listing, writer, contributor, subscription-wide, or resource-group-wide permissions. The Key Vault assignment uses `Key Vault Secrets User`, scoped to the vault. The vault remains empty.

This is an IaC and documentation change only. It does not provision cloud resources or authorize deployment.

## 3. Non-goals

- No Azure login, tenant/subscription inspection, provider validation, `what-if`, deployment, or live resource change.
- No Container Apps application, ingress, image, registry push, CI identity, federated credential, GitHub OIDC setup, or new workflow authentication.
- No secret values, database or schema migrations, runtime application changes, package/dependency additions, or production changes.
- No change to M42 governance, region, privacy/data-residency, budget, workload sizing, RPO/RTO, or operations-owner gates.
- No merge of M49, M50, or M51 pull requests.

## 4. Current Behavior and Evidence

- `infra/azure/pilot-foundation/main.bicep` currently creates the private Premium ACR and empty RBAC-enabled private Key Vault from M50, but no managed identities or role assignments.
- ACR's role-assignment mode is not currently explicit. Microsoft documents that ACR ABAC mode will become the default and that legacy `AcrPull` is not honored in that mode. M51 will explicitly enable `AbacRepositoryPermissions` and use the ABAC-compatible read role.
- The existing compile-only CI job pins Bicep v0.47.16 and runs `scripts/ci/check-azure-pilot-foundation.py`; it does not authenticate to Azure.
- The public hosted CI runner has no VNet path to the private ACR. M51 grants runtime image pull only and creates no image-publishing path.
- The Key Vault remains empty; the runtime identity receives a permission but no secret values are created.

## 5. Required Security and Architecture Rules

- Preserve private network access controls for ACR and Key Vault.
- Use separate identities for registry image pulls and API runtime secret reads; do not reuse one identity across these trust boundaries.
- Scope the ACR role assignment to the ACR and Key Vault role assignment to the Key Vault.
- Use `Container Registry Repository Reader` under ABAC mode, without granting repository catalog listing, write, delete, or control-plane access. Current image-repository names are not established; the registry-level read permission must be documented as read-only and eligible for narrower repository conditions once image names are approved.
- Use `Key Vault Secrets User` only for the backend identity; do not grant frontend or CI identities access to the vault.
- Give role assignments deterministic names derived from resource scope, identity resource ID, and role definition ID to support idempotent deployments without requiring a runtime principal ID in the resource name.
- Keep every required resource/name/tenant input explicit; do not add deployment defaults or committed parameter files.
- No application, database, dependency, or protected primary-checkout changes.

## 6. Acceptance Criteria

1. [ ] Two separate user-assigned identities are declared: ACR image-pull and backend runtime.
2. [ ] ACR is explicitly configured with `AbacRepositoryPermissions` and receives exactly one `Container Registry Repository Reader` assignment on the registry scope for the image-pull identity.
3. [ ] The backend runtime identity receives exactly one `Key Vault Secrets User` assignment scoped to the Key Vault; no secrets are created.
4. [ ] No ACR catalog lister, legacy `AcrPull`, writer, contributor, broad-scope role, frontend identity, GitHub/CI identity, or federated credential is added.
5. [ ] The ARM checker validates exact resource counts, role definitions, principals, scopes, ACR mode, and prohibited resource boundaries; it fails closed for malformed shapes.
6. [ ] README documents role semantics, registry-wide repository-read limitation, future narrowing gate, identity separation, and no-cloud boundary.
7. [ ] Pinned hosted Bicep compile and ARM checker pass; all relevant CI checks pass. Local compiler availability is reported accurately.
8. [ ] No migrations, app/dependency changes, secret data, or primary-checkout changes are introduced; `git diff --check` is clean and no unrelated/untracked assets are changed.
9. [ ] Commit/push the isolated branch and open a PR targeting M50's branch. Leave PRs unmerged and do not deploy.

## 7. Risks and Open Gates

- An ABAC-compatible repository Reader assigned without a repository condition can read image contents across the registry. The registry is dedicated to this project; narrow it to approved repository names when a repository naming contract exists.
- Role assignment propagation can take time after deployment; compile-only CI cannot verify runtime token acquisition or image pulls.
- Bicep compilation and static ARM checks do not prove provider availability, role assignment permission, ACR/Key Vault DNS, endpoint connectivity, cost, or deployment behavior.
- M42 governance and deployment gates remain unresolved. No deployment parameter file or Azure operation is authorized by this task.

## 8. Official References

Reviewed 2026-10-11:

- [Container Apps image pull with managed identity](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull)
- [ACR ABAC repository permissions](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-rbac-abac-repository-permissions)
- [ACR role assignment overview and recommended roles](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-rbac-built-in-roles-overview)
- [ACR registry Bicep schema](https://learn.microsoft.com/en-us/azure/templates/microsoft.containerregistry/registries)
- [Key Vault security built-in roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/security)
- [User-assigned identity Bicep schema](https://learn.microsoft.com/en-us/azure/templates/microsoft.managedidentity/userassignedidentities)
- [Azure role assignments](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments)
- [Bicep resource functions and role assignment examples](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/bicep-functions-resource)
