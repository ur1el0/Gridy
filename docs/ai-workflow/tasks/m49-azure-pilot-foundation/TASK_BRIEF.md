# M49 — Azure Non-production Pilot Foundation

## 1. Metadata

- **Task ID:** `m49-azure-pilot-foundation`
- **Task type:** Infrastructure-as-code feature and CI compile gate
- **Target components:** Azure Bicep, GitHub Actions, task documentation
- **Lead / implementer / reviewer:** Codex (user-directed sole-agent mode)
- **Branch:** `infra/m49-azure-pilot-foundation`
- **Base:** M48 local checkpoint `e952762a171d8bfd9430063e9baa302eed907c8c`, tree `e049ab0a2f8bdb8b90f16de973dc9c44854169c5`; equivalent M48 remote tree is on `test/m48-postgres-dns-reconnect`.

## 2. Objective and Scope

**Goal:** Add a parameter-required Bicep template for the candidate non-production Azure foundation and a CI job that only compiles it, without Azure authentication or resource deployment.

### In scope

- A resource-group-scoped Bicep template for a VNet, dedicated workload-profile Container Apps subnet, dedicated private PostgreSQL subnet, PostgreSQL private DNS zone/link, Log Analytics workspace, Container Apps managed environment, and PostgreSQL Flexible Server.
- Required parameters for region, resource names, address ranges, database engine/version/compute/storage/backup/HA choices, workspace retention/SKU, environment zone redundancy and workload profiles, and tags. The template uses the workload-profile ACA networking model; it does not silently choose a profile. No selected region, CIDR, SKU, database version, or other deployment defaults.
- A secure required database administrator password parameter. No outputs, local `.bicepparam` file, sample credentials, or committed compiled ARM template.
- A narrowly scoped GitHub Actions job that installs a pinned Bicep compiler and runs `az bicep build` only.
- A deployment-boundary README documenting remaining approval gates and why compilation does not establish subscription, region, SKU, network, policy, cost, or runtime validity.

### Non-goals

- No Azure login, subscription/account inspection, `az deployment`, ARM validation, `what-if`, provisioning, DNS/TLS changes, registry publication, or app deployment.
- No frontend/backend/mobile changes, database migration, schema change, production setting change, new application dependency, Celery/Redis, or secret value.
- No region, address space, SKU, PostgreSQL version, HA mode, backup geography, budget, legal/data-location decision, RPO/RTO, or owner approval inferred from examples.
- No application Container Apps resources, public API ingress, ACR, Key Vault integration, custom domain, GitHub OIDC role, or data migration. These require separate reviewed decisions and pilot evidence.

## 3. Current State and Evidence

- M42 recommends Azure Container Apps with the existing frontend/API images and Azure Database for PostgreSQL Flexible Server on private networking as a candidate non-production topology. It explicitly says this is not a deployment contract and leaves business, subscription, budget, region/data-location, and RPO/RTO gates open.
- M43 and M48 remove and test against the previous startup-time database IP pinning issue; M44 separates serialized migrations from application startup; M45 defines health probe semantics; M46 documents best-effort notifications and per-process throttle limitations; M47 records schema rollout compatibility. These changes reduce, but do not close, the M42 readiness gates.
- The current workflow in `.github/workflows/ci.yml` is read-only (`contents: read`) and runs branch/PR checks. M49 must add a compile-only job without Azure credentials or deployment permissions.
- Microsoft documents that workload-profile Container Apps environments need a dedicated delegated subnet of at least `/27`; the subnet size cannot be changed after environment creation. PostgreSQL private VNet integration requires a dedicated delegated subnet of at least `/28`, plus a Private DNS zone ending in `.postgres.database.azure.com` linked to the VNet.
- Bicep compilation (`az bicep build`) emits ARM JSON from source without accessing an Azure subscription; it is not provider-side deployment validation.

## 4. Required Architecture and Safety Rules

- The PostgreSQL server must use private VNet integration and must not expose a public network endpoint.
- ACA and PostgreSQL must use separate, dedicated subnets in the VNet, with service-required delegations. The template must not silently pick subnet CIDRs.
- The PostgreSQL private DNS zone suffix and VNet link must be explicit and consistent with Microsoft's private-network requirements.
- Use the empty external Container Apps environment from M42's candidate same-origin frontend topology; create no app, image, application ingress, or public API route in this foundation. Reassess public environment exposure before any deployment.
- Keep logs configuration explicit, including a required retention value. Do not claim this foundation implements the complete monitoring/alerting/retention operating model.
- Mark credential input `@secure()`, do not print or output it, and do not check in a parameter file.
- Do not add broad platform domains or change existing Render/Vercel/Firebase configuration.
- Do not bypass the production safety gate in `AGENTS.md`.

## 5. Observable Acceptance Criteria

1. [ ] `infra/azure/pilot-foundation/main.bicep` is resource-group scoped and declares all deployment/environment decisions as required parameters without defaults.
2. [ ] The template creates separate workload-profile ACA and PostgreSQL subnets, each with its required service delegation, a private DNS zone/link, a log workspace, a Container Apps environment, and a PostgreSQL Flexible Server connected only through private networking.
3. [ ] The PostgreSQL administrator password is a required secure parameter and is not emitted as an output or committed in any parameter/example file.
4. [ ] The template defines no app image, application ingress endpoint, registry credential, production hostname, or database migration action.
5. [ ] CI compiles the Bicep source with a pinned Bicep compiler and does not authenticate to Azure or run deployment, validation, or `what-if` commands.
6. [ ] The README and STATUS distinguish local/template compilation from Azure provider validation and retain all M42 decision gates as unresolved.
7. [ ] Bicep compiles with the pinned compiler locally when installed, or in the hosted compile-only CI job when it is unavailable locally; generated output stays out of the worktree, workflow checks pass, and `git diff --check` is clean.
8. [ ] No migrations, application source, production configuration, or runtime dependencies change; the primary checkout and protected untracked assets remain untouched.
9. [ ] The scoped branch is committed and pushed and a PR is opened against M48 branch `test/m48-postgres-dns-reconnect`; do not merge or deploy.

## 6. Relevant Files and References

- `docs/ai-workflow/tasks/m42-azure-migration-readiness/AUDIT.md`
- `docs/ai-workflow/tasks/m46-pilot-operational-guardrails/STATUS.md`
- `docs/ai-workflow/tasks/m47-schema-rollout-compatibility/STATUS.md`
- `docs/ai-workflow/tasks/m48-postgres-dns-reconnect/STATUS.md`
- `.github/workflows/ci.yml`
- New: `infra/azure/pilot-foundation/main.bicep`, `infra/azure/pilot-foundation/README.md`
- New CI job in `.github/workflows/ci.yml`

## 7. Constraints and Risks

- VNet and delegated subnet sizes are difficult or impossible to change after services are created. Require explicit non-overlapping address ranges and review them before any future deployment.
- ACA/PostgreSQL resource APIs and region/SKU availability change. The selected resource API versions and compiler version must be documented; actual provider and subscription validation remains a later, explicitly authorized task.
- Bicep compilation cannot prove region availability, quota, subnet overlap, policy permission, database compatibility, price, data residency, or runtime connectivity.
- No values for the M42 business/account gates are available. A deployment-ready parameter file must not be generated in this milestone.
