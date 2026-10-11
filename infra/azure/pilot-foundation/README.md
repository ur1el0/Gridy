# Azure non-production pilot foundation

This resource-group-scoped Bicep template defines a candidate Azure foundation for a future non-production KapitBayan pilot:

- One virtual network with dedicated Container Apps, PostgreSQL Flexible Server, and private endpoint subnets.
- PostgreSQL, Azure Container Registry, and Key Vault private DNS zones linked to the virtual network.
- A Log Analytics workspace with explicit SKU and retention inputs.
- A Container Apps managed environment with log forwarding and VNet integration.
- A PostgreSQL Flexible Server configured for private VNet integration.
- A Premium Azure Container Registry with public access disabled and a private endpoint.
- An empty RBAC-enabled Key Vault with public access disabled and a private endpoint.
- Separate user-assigned identities for image publishing, Container Apps image pulls, and backend API secret reads, with registry writer permissions restricted by repository ABAC conditions.

The template creates **no Container Apps, application ingress, custom domains, DNS cutover, database migrations, registry images, or Key Vault secrets**. The empty managed environment uses the external environment mode from M42's candidate topology, so a future frontend can provide the same-origin public edge; no application endpoint is created. Reassess that exposure before deployment. The PostgreSQL resource has no public database endpoint: it uses delegated-subnet/private-DNS integration.

## Required inputs

There is deliberately no .bicepparam example and no deployment defaults. Select all values only after reviewing the target subscription and completing the M42 decision gates. Required input groups are:

- Azure region and resource names, including globally unique ACR and Key Vault names.
- VNet and dedicated subnet CIDRs for Container Apps, PostgreSQL, and private endpoints. Subnets must not overlap one another, connected networks, or any ACA reserved infrastructure range.
- Container Apps environment zone-redundancy setting and workload profiles.
- Log Analytics SKU and retention period.
- PostgreSQL major version, compute SKU/tier, storage size/auto-grow, backup policy, HA mode/standby zone, administrator login, and secure password.
- Key Vault tenant ID and soft-delete retention period (7–90 days).
- User-assigned identity names for the registry image-pull principal and backend API runtime principal.
- Organization-required resource tags, including owner and cost-center values.

This template supports a workload-profile Container Apps environment. Microsoft documents a dedicated subnet of at least /27, delegated to Microsoft.App/environments; the exact selected profile, headroom, and region support must be checked before deployment. Consumption-only environments have a different /23, non-delegated subnet contract and are intentionally outside this template.

The PostgreSQL subnet is delegated only to Microsoft.DBforPostgreSQL/flexibleServers; Microsoft documents /28 as the minimum, with larger allocation needed for HA and future capacity. The template appends .postgres.database.azure.com to the required DNS-zone prefix, then links the zone to the VNet. Do not make the prefix equal to the PostgreSQL server name. Subnet sizes cannot be changed after the Container Apps environment is created, so have a network owner review the CIDRs before any deployment.

The private-endpoint subnet is separate from both delegated subnets, has no service delegation, and disables private-endpoint network policies as required for this template's network contract. Two endpoints are created, one for the ACR registry subresource and one for the Key Vault vault subresource. Their private DNS zone groups associate the endpoints with the linked privatelink.azurecr.io and privatelink.vaultcore.azure.net zones.

## Registry, identity, and secret-store controls

- ACR Private Link is available only on the **Premium** registry tier. The template constrains the SKU parameter to Premium, disables the registry admin account and anonymous pull, disables trusted-service network bypass, and disables public network access. Premium registry and private-endpoint charges require a budget review before deployment.
- ACR explicitly uses `AbacRepositoryPermissions`, so access uses ABAC-compatible roles and does not depend on the registry's changing default mode. The dedicated image-pull identity receives `Container Registry Repository Reader` at the registry scope. This grants read access to image data across the registry, but does not grant catalog listing, image writes/deletes, or control-plane access. Once the backend/frontend repository names are approved, narrow the assignment with repository-specific ABAC conditions in a separately verified change.
- The image-publisher identity is distinct from both runtime identities. It receives two `Container Registry Repository Writer` assignments at ACR scope; each uses an ABAC `StringEqualsIgnoreCase` condition for one exact repository name and gates all four Writer data actions (repository metadata/content read/write). The Writer role does not grant repository catalog listing or registry control-plane access, and it has no content-delete data action; metadata write permissions can change repository tag metadata.
- The backend and frontend repository names are required deployment inputs with no defaults. The current `:ci` Docker tags do not establish Azure repository names. Supply only approved lowercase ACR repository names with valid Docker repository syntax when a separately authorized deployment is planned. Bicep enforces non-empty values but cannot express a regex constraint for the full naming grammar, so the deployment preflight must reject invalid characters before it materializes the ABAC conditions. The template does not create a publishing credential, GitHub federation, runner, or image.
- Before a future authorized deployment from an ARM JSON parameter file, run the offline repository-name preflight against the exact file that will be passed to deployment:

  ~~~bash
  python3 scripts/ci/check_acr_repository_parameters.py /path/to/approved.parameters.json
  ~~~

  It requires distinct literal string values for both repository parameters, rejects malformed/duplicate JSON keys, tags/digests, registry-host prefixes, invalid Docker-compatible paths, and names over 255 characters. A dotted first path component followed by `/` is conservatively treated as host-like and rejected; if approved naming needs such a namespace, adjust this validator through a reviewed change before deployment. The command reads the parameter file but does not print its contents or the repository values. Passing it proves only input syntax and shape; it does not check Azure availability, account policy, uniqueness, M42 approvals, or authorize an Azure operation. No concrete parameter file or values are included in this repository.
- The backend API has a separate user-assigned identity with `Key Vault Secrets User` at the Key Vault scope. This grants secret read access only; the frontend and CI receive no vault role. The vault remains empty in this milestone, and no credentials or secret values are added to source control.
- Key Vault uses Standard SKU because this foundation stores application secrets, not HSM-backed keys. Data access uses Azure RBAC; soft delete and purge protection are enabled, and retention is required as an explicit bounded input. Purge protection is an irreversible setting after a vault is deployed.
- The Key Vault is empty in this milestone: no secrets, certificates, or keys are created. Public network access is disabled. Microsoft documents that trusted Azure services may remain an exception to the private-endpoint traffic rule; no secret data is present here, and any later data-plane use requires a separate access review.
- A standard public GitHub-hosted Actions runner has no private network path to this ACR. ADR 015 conditionally prefers a GitHub-hosted larger runner connected to an Azure VNet for a trusted release-only publishing job, if the repository's organization/plan entitlement, approved region, network design, budget, and operational owner are confirmed. None of these prerequisites is approved or configured here. Keep ordinary PR CI unprivileged; publish only protected trusted refs with narrowly constrained short-lived federation in a later reviewed milestone. Reassess ACR Tasks if the conditional GitHub path is unavailable, using current region, lifecycle, security, and cost evidence. This task does not push images.

## Compile-only validation

Install the pinned Bicep compiler v0.47.16 using Azure CLI and compile without connecting to Azure:

~~~bash
az bicep install --version v0.47.16
az bicep version
az bicep build --file infra/azure/pilot-foundation/main.bicep --stdout
~~~

The CI job performs this compile and checks the generated ARM template contract. It does not run az login, query a subscription, or invoke deployment, provider validation, or what-if commands. Compilation checks Bicep syntax and resource type shapes against compiler metadata only. It does not establish region/SKU availability, address-range overlap, subscription policy, quota, cost, data residency, private DNS resolution, endpoint approval, trusted-service behavior, or deployed access.

The secure PostgreSQL administrator password remains a required secure parameter. Supply it only through an approved secret channel in a later deployment task; do not place a real value in GitHub Actions, a parameter file, or logs. The workspace shared key is resolved from the workspace resource during deployment and passed directly to the Container Apps logging configuration. No secret values are created in Key Vault. The template emits no outputs.

## Gates before any deployment

M42's outstanding gates remain open:

1. Named subscription, billing, budget, and operational owners.
2. LGU/data-owner/legal/privacy approval for the Azure region and backup data geography, especially resident evidence and identity documents.
3. Workload sizing and provider/SKU/region/quota availability review.
4. Agreed and funded backup retention, HA choice, RPO, and RTO.
5. Review of non-overlapping network ranges, immutable subnet sizing, private DNS, ingress exposure, and outbound access to Cloudinary, Firebase, and SMTP.
6. A separately reviewed deployment and parity plan covering the frontend reverse proxy, internal API routing, health probes, migration gate, assignment of the backend identity to its app, approved secret names, repository-specific ACR conditions once image names are fixed, private image publication/pull, private media access, authentication cookies, and mobile API hostname.

This template is not a production-ready deployment or a substitute for provider-side validation and a non-production rehearsal. Do not deploy it until the approval gates are complete and a separate task explicitly authorizes the Azure resource operation.

## Microsoft references

References reviewed 2026-10-11:

- [Container Apps VNet integration](https://learn.microsoft.com/en-us/azure/container-apps/custom-virtual-networks) — separate workload-profile and consumption-only subnet requirements.
- [PostgreSQL Flexible Server private networking](https://learn.microsoft.com/en-us/azure/postgresql/network/concepts-networking-private) — delegated subnet, minimum /28, DNS-zone suffix, and VNet link requirements.
- [ACR Private Link](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-private-link) — Premium-tier requirement, private DNS zone, endpoint subresource, public-access behavior, and hosted-agent constraints.
- [Key Vault Private Link](https://learn.microsoft.com/en-us/azure/key-vault/general/private-link-service) — private DNS zone and private endpoint configuration.
- [Key Vault network security](https://learn.microsoft.com/en-us/azure/key-vault/general/how-to-azure-key-vault-network-security) — public-access-disabled behavior and trusted-service exception.
- [Container Apps image pull with managed identity](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull) — user-assigned identity authentication for private registry pulls.
- [ACR ABAC repository permissions](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-rbac-abac-repository-permissions) — supported role-assignment modes, ABAC-compatible image-reader roles, and repository scoping.
- [ACR role assignment overview](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-rbac-built-in-roles-overview) — recommended roles for container orchestrators.
- [Key Vault security built-in roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/security) — Key Vault Secrets User scope and permissions.
- [User-assigned identity Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.managedidentity/userassignedidentities) and [Azure role assignments](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments) — resource and assignment contract.
- [Container Registry Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.containerregistry/2025-11-01/registries) — supported role-assignment mode, SKU, and network properties.
- [Key Vault Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.keyvault/vaults) — RBAC, soft delete, purge protection, and network properties.
- [Private Endpoints Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.network/privateendpoints) — private-link connection and subnet resource shape.
- [Private DNS zone groups Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.network/2024-05-01/privateendpoints/privatednszonegroups) — private zone association shape.
- [Private Endpoint network policies](https://learn.microsoft.com/en-us/azure/private-link/disable-private-endpoint-network-policy) — subnet policy settings.
- [Bicep compile command](https://learn.microsoft.com/en-us/cli/azure/bicep#az-bicep-build) — compile source to ARM JSON.
- [Bicep secret handling](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/scenarios-secrets) — secure parameters and secret handling guidance.
