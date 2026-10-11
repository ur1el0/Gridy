# Task Brief: M50 — Private Container Registry and Key Vault Foundation

## 1. Metadata
- **Task ID:** `m50-private-acr-keyvault`
- **Task Type:** Infrastructure feature
- **Target Components:** Azure Bicep foundation, compile-only CI contract, infrastructure documentation
- **Lead / Writer:** Codex (user-directed sole-agent mode)
- **Reviewer:** Codex self-review
- **Branch:** `infra/m50-private-acr-keyvault`
- **Base:** M49 local checkpoint `4d5a3abe2c96c4f11363fc12952816e3826c31d5`, whose content tree is `c1d87e3911e7825f424b4d2b4c8bbac0dc178885`
- **Intended remote PR base:** `infra/m49-azure-pilot-foundation` (M49 PR #180, open and unmerged)

## 2. Objective and Scope
Extend the M49 compile-only Azure pilot foundation with a private Azure Container Registry (ACR) and an empty, private-endpoint-only Azure Key Vault, connected to the existing VNet through a dedicated private-endpoint subnet and private DNS zones.

### Non-goals
- Do not access Azure accounts, inspect subscriptions, sign in, run ARM/provider validation or `what-if`, or create/change/delete cloud resources.
- Do not publish images, upload secrets, create Key Vault secret values, or configure credentials.
- Do not add Container Apps, app definitions, ingress, managed identities, RBAC assignments, custom domains, production hostnames, database migrations, application-source changes, or runtime dependencies.
- Do not select an Azure region, estimate or commit to spend, claim provider availability, or close M42's governance/data-residency/operations gates.
- Do not change M49's parent branch or merge either PR.

## 3. Current Behavior and Evidence
M49's `infra/azure/pilot-foundation/main.bicep` defines the VNet, delegated Container Apps and PostgreSQL subnets, PostgreSQL private DNS, Log Analytics, an empty Container Apps environment, and private PostgreSQL. Its README explicitly states that ACR and Key Vault are not yet included. The existing GitHub Actions job compiles Bicep with pinned compiler v0.47.16 and runs `scripts/ci/check-azure-pilot-foundation.py` against compiled ARM JSON without Azure credentials.

A private ACR is needed before future application images can be stored and pulled privately. A private Key Vault is the intended later secret store. Since the selected pattern disables their public access, ordinary hosted GitHub runners cannot reach the ACR data plane. This milestone creates neither an image workflow nor credentials; a later task must choose a private runner/build path before image publication.

## 4. Required Business and Architecture Rules
- Preserve M42's non-production-only status and all unresolved subscription, region, budget, data residency/privacy, workload, RPO/RTO, and operations-owner gates.
- Keep database networking private and preserve the existing M49 resources and contracts.
- Use private endpoints and private DNS for both ACR and Key Vault; disable their public network access.
- ACR Private Link requires Premium tier. Do not add a default registry name or any credentials.
- Key Vault uses Azure RBAC authorization, soft delete, purge protection, and no committed or deployed secret data.
- Keep infrastructure source compilation separate from Azure provider validation and live deployment.
- Do not introduce Celery, Redis, application dependencies, or database schema changes.

## 5. Observable Acceptance Criteria
1. [ ] Bicep adds a dedicated private-endpoint subnet with no service delegation and private-endpoint network policies disabled; it has required name/CIDR inputs and no deployment defaults.
2. [ ] ACR is parameter-named, constrained to the Premium tier required for Private Link, has its admin user disabled and public network access disabled, and is attached to a private endpoint using the `registry` subresource.
3. [ ] Key Vault is parameter-named, uses the required tenant ID, standard SKU for the secrets-only foundation, Azure RBAC authorization, soft delete, purge protection, a bounded 7–90 day soft-delete retention input, and disabled public network access.
4. [ ] ACR and Key Vault each have a private endpoint, a private DNS zone (`privatelink.azurecr.io` and `privatelink.vaultcore.azure.net`), a non-auto-registering VNet link, and a private DNS zone group attached to the endpoint.
5. [ ] The compiled-template checker validates all new parameters, resource types, security settings, target resource IDs/subresources, endpoint subnet use, DNS zone/link relationships, and absence of outputs, secrets, role assignments, application resources, or unexpected resource types.
6. [ ] The README documents private access, ACR Premium cost implications, Key Vault data-plane reachability, CI runner limitations, and the exact no-cloud boundary; it preserves M42 gates and does not imply operational verification.
7. [ ] The existing pinned compile-only CI job validates the expanded template and checker without Azure login, subscription access, ARM validation, deployment, or `what-if`.
8. [ ] Verification output is recorded honestly in STATUS.md. If local Bicep is unavailable, hosted compile-only CI is required to close compile verification; this is not provider validation.
9. [ ] No migrations, application source, runtime dependencies, or production settings change; the primary checkout and protected untracked files remain untouched.
10. [ ] Changes are committed and pushed to the scoped branch and a PR is opened against M49's `infra/m49-azure-pilot-foundation` branch. Do not merge or deploy.

## 6. Files in Scope
- `infra/azure/pilot-foundation/main.bicep`
- `infra/azure/pilot-foundation/README.md`
- `scripts/ci/check-azure-pilot-foundation.py`
- `.github/workflows/ci.yml` only if compile job needs a scoped path/dependency adjustment
- `docs/ai-workflow/tasks/m50-private-acr-keyvault/{TASK_BRIEF.md,PLAN.md,STATUS.md}`

## 7. Verification and Risks
Compile with the existing pinned Bicep compiler, run the expanded static ARM contract checker, inspect YAML/workflow permissions and all changed files, run `git diff --check`, verify no staged/untracked unrelated paths are touched, then inspect hosted CI. Azure provider support, quota, cost, name availability, private DNS resolution, endpoint approval, and service access remain unverified until a separately authorized non-production deployment.
