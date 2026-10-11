# Azure non-production pilot foundation

This resource-group-scoped Bicep template defines a candidate Azure foundation for a future non-production KapitBayan pilot:

- One virtual network with dedicated Container Apps and PostgreSQL Flexible Server subnets.
- A PostgreSQL private DNS zone linked to the virtual network.
- A Log Analytics workspace with explicit SKU and retention inputs.
- A Container Apps managed environment with log forwarding and VNet integration.
- A PostgreSQL Flexible Server configured for private VNet integration.

The template creates **no Container Apps**, images, application ingress, ACR, Key Vault, custom domains, DNS cutover, or database. The empty managed environment uses the external environment mode from M42's candidate topology, so a future frontend can provide the same-origin public edge; no application endpoint is created in M49. Reassess that exposure before deployment. The PostgreSQL resource has no public-network setting: it uses delegated-subnet/private-DNS integration.

## Required inputs

There is deliberately no `.bicepparam` example and no deployment defaults. Select all values only after reviewing the target subscription and completing the M42 decision gates. Required input groups are:

- Azure region and resource names.
- VNet and dedicated subnet CIDRs. Subnets must not overlap one another, connected networks, or any ACA reserved infrastructure range.
- Container Apps environment zone-redundancy setting and workload profiles. The external environment mode follows M42's candidate same-origin frontend design; moving to a private-only environment needs an additional reviewed routing design.
- Log Analytics SKU and retention period.
- PostgreSQL major version, compute SKU/tier, storage size/auto-grow, backup policy, HA mode/standby zone, administrator login, and secure password.
- Organization-required resource tags, including owner and cost-center values.

This template supports a workload-profile Container Apps environment. Microsoft documents a dedicated subnet of at least `/27`, delegated to `Microsoft.App/environments`; the exact selected profile, headroom, and region support must be checked before deployment. Consumption-only environments have a different `/23`, non-delegated subnet contract and are intentionally outside this template.

The PostgreSQL subnet is delegated only to `Microsoft.DBforPostgreSQL/flexibleServers`; Microsoft documents `/28` as the minimum, with larger allocation needed for HA and future capacity. The template appends `.postgres.database.azure.com` to the required DNS-zone prefix, then links the zone to the VNet. Do not make the prefix equal to the PostgreSQL server name. Subnet sizes cannot be changed after the Container Apps environment is created, so have a network owner review the CIDRs before any deployment.

## Compile-only validation

Install the pinned Bicep compiler `v0.47.16` using Azure CLI and compile without connecting to Azure:

```bash
az bicep install --version v0.47.16
az bicep version
az bicep build --file infra/azure/pilot-foundation/main.bicep --stdout
```

The CI job performs this compile and checks the generated ARM template contract. It does not run `az login`, query a subscription, or invoke deployment, provider validation, or `what-if` commands. Compilation confirms Bicep syntax and resource type shapes against the compiler's type metadata only. It does not establish that a region/SKU is available, address ranges are valid/non-overlapping, subscription policy permits deployment, quotas exist, prices are acceptable, or services can communicate after deployment.

The secure PostgreSQL administrator password is a required `@secure()` parameter. Supply it only through an approved secret channel in a later deployment task; do not place a real value in GitHub Actions, a parameter file, or logs. The workspace shared key is resolved from the workspace resource during deployment and is passed directly to ACA's logging configuration. The template emits no outputs.

## Gates before any deployment

M42's outstanding gates remain open:

1. Named subscription, billing, budget, and operational owners.
2. LGU/data-owner/legal/privacy approval for the Azure region and backup data geography, especially resident evidence and identity documents.
3. Workload sizing and provider/SKU/region/quota availability review.
4. Agreed and funded backup retention, HA choice, RPO, and RTO.
5. Review of non-overlapping network ranges, immutable subnet sizing, private DNS, ingress exposure, and outbound access to Cloudinary, Firebase, and SMTP.
6. A separately reviewed deployment and parity plan covering the frontend reverse proxy, internal API routing, health probes, migration gate, secrets, private media access, authentication cookies, and mobile API hostname.

This template is not a production-ready deployment or a substitute for a provider-side validation and non-production rehearsal. Do not deploy it until the approval gates are complete and a separate task explicitly authorizes the Azure resource operation.

## Microsoft references

References reviewed 2026-10-11:

- [Container Apps VNet integration](https://learn.microsoft.com/en-us/azure/container-apps/custom-virtual-networks) — separate workload-profile and consumption-only subnet requirements.
- [PostgreSQL Flexible Server private networking](https://learn.microsoft.com/en-us/azure/postgresql/network/concepts-networking-private) — delegated subnet, minimum `/28`, DNS-zone suffix, and VNet link requirements.
- [Container Apps managed environment Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.app/2025-07-01/managedenvironments) — resource API shape and Log Analytics configuration.
- [PostgreSQL Flexible Server Bicep resource](https://learn.microsoft.com/en-us/azure/templates/microsoft.dbforpostgresql/2025-08-01/flexibleservers) — private network, backup, HA, storage, SKU, and secure administrator-password properties.
- [Bicep compile command](https://learn.microsoft.com/en-us/cli/azure/bicep#az-bicep-build) — compile source to ARM JSON.
- [Bicep secret handling](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/scenarios-secrets) — secure parameters and secret handling guidance.
