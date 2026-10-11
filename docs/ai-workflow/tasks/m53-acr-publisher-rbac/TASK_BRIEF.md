# M53 — Least-Privilege ACR Publisher Identity

## 1. Metadata

- **Task ID:** `m53-acr-publisher-rbac`
- **Task type:** Azure infrastructure foundation and static ARM contract hardening
- **Branch:** `infra/m53-acr-publisher-rbac`
- **PR base:** `infra/m52-private-image-publish-path` (PR #183 remains open and unmerged)
- **Worktree:** `/tmp/gridy-m53-acr-publisher-rbac`
- **Base commit:** `5289f472fca6dedfdea59f78f5c899fd49464e5`
- **Base tree:** `09b5fbde9481c0b618ee98dee9df814c8318a633`

## 2. Goal

Extend the M49–M52 Azure foundation with a dedicated user-assigned image-publisher identity. Grant it only the ABAC-compatible `Container Registry Repository Writer` data-plane permissions for two explicitly supplied repository names, and extend the compiled ARM checker so an accidental registry-wide assignment or role/scope/principal mismatch fails closed.

The image repository names remain unapproved. They must be required deployment inputs with no defaults; this task does not select their values. The resulting template prepares a safe authorization contract, not a running publisher.

## 3. Evidence and Decisions

- ADR 015 conditionally prefers a private-network GitHub-hosted larger runner for trusted release publishing, subject to GitHub account/plan, region, budget, and ownership gates. M53 does not implement that runner or pipeline.
- M50 configures a private Premium ACR with public access disabled and ABAC repository permissions enabled.
- M51 provisions a separate image-pull identity with registry-reader permissions and a backend runtime identity with Key Vault Secrets User. The new publisher must remain distinct from both.
- The current CI labels `kapitbayan-backend:ci` and `kapitbayan-frontend:ci` are not approved ACR repository names. Do not turn them into deployment defaults.
- Microsoft's built-in Repository Writer role contains four data actions: repository metadata read/write and repository content read/write. Microsoft documents exact repository-name ABAC conditions using `StringEqualsIgnoreCase`.
- Hindsight search/list/capture were attempted; the local Hindsight service at `127.0.0.1:9077` refused connections.

## 4. Scope

- Add one required publisher identity name parameter and one user-assigned managed identity resource.
- Add required, no-default parameters for backend and frontend ACR repository names.
- Add exactly two deterministic role assignments to the publisher identity, each scoped to the ACR and conditioned on one exact supplied repository name using condition version `2.0`.
- Extend `scripts/ci/check-azure-pilot-foundation.py` to validate the publisher identity, exact writer-role assignment count, principal, registry scope, condition version, all four writer data actions, and exact parameter-bound repository condition. Reject missing conditions and registry-wide writer grants.
- Update the operator README with the writer role's boundaries, required repository-name inputs, the publisher/runtime identity split, and the still-conditional private runner path.
- Add this task packet and record actual local/hosted checks in STATUS.md.

## 5. Non-Goals and Safety Boundary

- No Azure login, subscription inspection, provider validation, `what-if`, deployment, resource creation, role assignment, identity federation, or secret creation.
- No GitHub organization transfer, plan purchase, runner/network setup, OIDC credential, workflow authentication, image build/push, digest promotion, or production change.
- No concrete repository values or registry names are selected; no parameter defaults or committed deployment parameter files are added.
- No change to ACR public-network access, M42 governance gates, M51 runtime identities/roles, application code, database/schema, dependencies, or CI workflow authentication.
- No merge. Publish the isolated branch and open a PR targeting M52, then leave it open and unmerged.
- Preserve the primary checkout and its unrelated untracked agent/environment/logo assets.

## 6. Required Security and Architecture Rules

- The publisher identity must not be reused as the ACR image-pull identity or backend Key Vault identity.
- Use only the built-in `Container Registry Repository Writer` role (`2a1e307c-b015-4ebd-883e-5b7698a07328`) at ACR scope with ABAC conditions. Do not assign legacy `AcrPush`, registry-wide writer without a condition, Catalog Lister, Contributor, or broad-scope permissions.
- Each role assignment must constrain all four Writer data actions to one exact repository name:
  - `Microsoft.ContainerRegistry/registries/repositories/metadata/read`
  - `Microsoft.ContainerRegistry/registries/repositories/content/read`
  - `Microsoft.ContainerRegistry/registries/repositories/metadata/write`
  - `Microsoft.ContainerRegistry/registries/repositories/content/write`
- Use `StringEqualsIgnoreCase`, not a prefix or wildcard. Use the registry resource as assignment scope; the repository boundary belongs in the ABAC condition.
- Keep repository values as required inputs without defaults until the naming contract is approved. A deployment operator must provide the approved backend/frontend repository names.
- Deployment values must be valid lowercase ACR repository names. Bicep parameter decorators enforce non-empty strings but do not provide a regex constraint; the separately approved deployment preflight must reject invalid characters before role conditions are materialized.
- Keep role assignment names deterministic and distinct even if an invalid deployment supplies identical repository-name values.
- Keep CI and PR verification unprivileged. This task grants no federation and gives no identity credentials to any workflow.

## 7. Acceptance Criteria

1. [ ] Exactly one new user-assigned publisher identity has an explicit required name parameter; existing runtime identities remain separate and unchanged.
2. [ ] Backend and frontend repository names are required inputs with no defaults or inferred values.
3. [ ] Exactly two `Container Registry Repository Writer` assignments target the ACR and publisher principal, with condition version `2.0` and one exact-name condition per repository parameter.
4. [ ] Conditions constrain every Writer data action; no ACR writer, catalog-listing, legacy push, delete/contributor, or broader-scope role is present.
5. [ ] The compiled ARM checker fails closed for missing, malformed, registry-wide, wildcard/prefix, wrong-principal, wrong-role, wrong-scope, missing-action, and wrong-parameter writer assignments.
6. [ ] README describes the role permissions and limits, parameter requirements, identity separation, private network publishing conditions, and no-cloud boundary without contradicting ADR 015.
7. [ ] Python syntax/static checks pass locally; pinned hosted Bicep compilation and ARM checker pass. Local compiler availability is recorded accurately.
8. [ ] No Azure resource operation, workflow authentication, application/schema/dependency change, or concrete repository choice is introduced; `git diff --check` is clean.
9. [ ] The scoped branch is committed and pushed with content tree matching the local candidate; its PR targets M52 and remains open/unmerged.
10. [ ] Primary checkout tracked state and unrelated untracked agent/environment/logo assets remain untouched.

## 8. Official References

Reviewed 2026-10-11:

- [ACR ABAC repository permissions](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-rbac-abac-repository-permissions) — repository conditions, condition version, and assignment scope.
- [ACR built-in roles overview](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-rbac-built-in-roles-overview) — role use cases and ABAC support.
- [ACR built-in roles directory reference](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-rbac-built-in-roles-directory-reference) — Repository Writer permission semantics.
- [Azure built-in roles for Containers](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/containers) — Writer role ID and exact data-action list.
- [Azure role assignments Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.authorization/roleassignments) — condition and conditionVersion resource properties.
- [User-assigned identity Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.managedidentity/userassignedidentities).
- [ADR 015: Private ACR Image Build and Publish Path](../../../../architecture/decisions/015-private-acr-image-build-path.md).
