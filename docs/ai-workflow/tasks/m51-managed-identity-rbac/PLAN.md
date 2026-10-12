# Plan: M51 — Managed Identity and Least-Privilege Access Foundation

## 1. Plan Overview

- **Associated brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target branch:** `infra/m51-managed-identity-rbac`
- **PR base:** `infra/m50-private-acr-keyvault`
- **Worktree:** `/tmp/gridy-m51-managed-identity-rbac`
- **Base content tree:** `f5a947d204c917de05e3f161dbeca42bb8cfdbf8`
- **Complexity:** Medium

## 2. Milestones

### M1 — Baseline, role model, and no-cloud boundary

1. Verify the isolated worktree, M50 tree, PR #181 state, and M50 hosted verification.
2. Inspect M42 gates and M49/M50 Bicep, checker, README, and compile-only workflow.
3. Review current Microsoft documentation for Container Apps image-pull identities, ACR ABAC roles/mode, Key Vault Secrets User, managed identity resources, and role assignments.
4. Decide exact identities and role scopes before source edits. Use a dedicated image-pull identity with ACR repository Reader, and a distinct backend identity with Key Vault Secrets User. Keep current repo naming unspecified and explicitly document the resulting registry-wide read limit.
5. Record that local Azure tooling is unavailable and the work must remain compile-only/no Azure authentication.

**Validation:** inspect Git/worktree state, official-source URLs and access date, and `command -v az`/`command -v bicep`. No cloud command beyond checking local CLI availability.

### M2 — Add identities and least-privilege assignments

1. Add two required name parameters and two `Microsoft.ManagedIdentity/userAssignedIdentities` resources with the existing region/tags.
2. Set ACR `roleAssignmentMode` explicitly to `AbacRepositoryPermissions`.
3. Add one deterministic role assignment scoped to ACR for `Container Registry Repository Reader` and the image-pull identity.
4. Add one deterministic role assignment scoped to Key Vault for `Key Vault Secrets User` and the backend runtime identity.
5. Do not create app, secret, credential, federated identity, CI identity, role assignment at a broader scope, or ACR catalog-lister assignment.

**Validation:** inspect generated Bicep resource relationships and statically assert exactly 2 identities/2 role assignments and no forbidden resource declarations. Compile through existing pinned hosted job.

### M3 — Harden the ARM contract checker and operator documentation

1. Update the exact compiled-resource inventory from M50 to include exactly two managed identities and two role assignments.
2. Assert ACR ABAC mode, exact role IDs, principal-to-identity mappings, and ACR/Key Vault target scopes. Fail closed on missing or malformed ARM resource shapes.
3. Continue rejecting app resources, Key Vault secrets, role assignments beyond the two scoped expected assignments, CI/federated credentials, and registry push/catalog-listing roles.
4. Update README with identity separation, data permissions, ACR ABAC mode, registry-wide read limitation pending repository-name decisions, private networking, and no-auth/no-deploy boundary.
5. Do not alter CI authentication or compiler pin; retain the existing compile-only least-permission job.

**Validation:** Python syntax check, local checker/static source tests as available, workflow contract check, `git diff --check`, and hosted pinned Bicep compile plus expanded ARM checker.

### M4 — Review and delivery

1. Review all changed paths and compiled contract against this brief; verify no app/schema/dependency/secrets changes.
2. Confirm the primary checkout and protected untracked assets remain unchanged.
3. Commit the scoped result locally. Publish an equivalent commit whose parent is the latest remote M50 branch head and verify its tree equals the local content tree.
4. Open a PR targeting `infra/m50-private-acr-keyvault`, refresh its description with actual verification results, and inspect hosted checks.
5. Do not merge, deploy, authenticate to Azure, run provider validation/what-if, publish images, or write secrets.

## 3. Comprehensive Verification

- [ ] `command -v az` and `command -v bicep` availability recorded.
- [ ] Bicep v0.47.16 compile and ARM contract checker pass in hosted CI.
- [ ] Exact identity and role assignment counts, role IDs, principal mappings, scopes, and ACR mode are checked.
- [ ] CI remains pinned/read-only and includes no Azure login, deployment, provider validation, or what-if.
- [ ] `git diff --check` passes and only scoped files are committed.
- [ ] No application tests are needed for this infrastructure-only change; existing CI results are recorded accurately.
- [ ] PR is open, targets M50, and remote tree matches the completed local tree.

## 4. Risks and Rollback

- The ACR Repository Reader role without an ABAC condition can read image data in every repository in this dedicated registry. Once backend/frontend repository names are approved, a later change should add repository-specific conditions and test them at deployment time.
- Role assignments may require deployment identity permissions and can take time to propagate. No such identity or role is granted in this task.
- No role assignment or template compile proves private DNS or runtime image/secret access. Those require an approved VNet-connected deployment rehearsal.
- M42 subscription, region, privacy/data-residency, budget, workload, RPO/RTO, and operational-owner gates remain open.
- Rollback is reverting the isolated branch commits; no Azure resource is created by this task.

## 5. Architectural Decisions and References

- User-assigned identities are used so future Container Apps can refer to stable identities without needing an application resource in this task.
- Separate trust boundaries: ACR image pull is read-only registry data-plane access; backend Key Vault access is only the data-plane secret-reader role at vault scope.
- Explicit ACR ABAC mode avoids relying on a platform default that Microsoft says will change; don't use legacy `AcrPull` under ABAC mode.
- References reviewed 2026-10-11 are listed in [TASK_BRIEF.md](TASK_BRIEF.md).
