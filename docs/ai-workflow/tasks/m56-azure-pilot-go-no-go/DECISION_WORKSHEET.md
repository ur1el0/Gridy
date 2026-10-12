# Azure Pilot Go/No-Go Evidence Worksheet

**Worksheet status: NOT APPROVED — all decisions remain `UNDECIDED`.**

This worksheet organizes evidence required by M42 and the M49–M55 infrastructure contracts. It is not an approval, Azure authorization, deployment request, legal assessment, or production release decision. Do not run a cloud operation because this worksheet is complete; obtain the approvals required by the applicable organization first.

Keep the tracked copy blank. Record only safe evidence references here. Store subscription identifiers, private contact details, billing documents, credentials, resident data, and other restricted material in the appropriate owner-controlled system.

## 1. Decision Register

Use only these statuses: `UNDECIDED`, `APPROVED`, `REJECTED`, or `NOT APPLICABLE`. An `APPROVED` entry requires the accountable role, a decision date, and a traceable evidence reference. Technical CI results cannot substitute for an owner decision.

| ID | Required decision / evidence | Accountable owner role | Status | Evidence reference (safe link/name) | Decision date |
| --- | --- | --- | --- | --- | --- |
| G-01 | Confirm Azure provides a material organizational or operational benefit over the current hosting arrangement. | Product / LGU sponsor | UNDECIDED |  |  |
| G-02 | Identify the subscription owner, billing agreement, governance and policy requirements, and support plan. | Azure subscription owner | UNDECIDED |  |  |
| G-03 | Name the budget owner and approve a spending ceiling. | Finance / budget owner | UNDECIDED |  |  |
| G-04 | Provide representative workload facts: daily and peak traffic, concurrency, database size/growth, file volume, retention, mobile release cadence, and acceptable downtime. | Application / data owners | UNDECIDED |  |  |
| G-05 | Approve permitted data locations, sensitive resident-evidence handling, backup geography, and legal/privacy requirements. | LGU / data owner with legal or privacy authority | UNDECIDED |  |  |
| G-06 | Set recovery point objective, recovery time objective, backup retention, and required restore evidence. | Service / data owner | UNDECIDED |  |  |
| G-07 | Decide whether daemon-thread email/FCM delivery may remain best-effort for the pilot; separately approve durable work if required. | Product / operations owner | UNDECIDED |  |  |
| G-08 | Decide whether per-process throttle counters are acceptable for the pilot scale; separately approve shared enforcement if they are not. | Security / application owner | UNDECIDED |  |  |
| G-09 | Select a candidate region only after data-location approval; verify Container Apps plan/features, PostgreSQL version/SKU/HA/backup, ACR, Key Vault, quota, and subscription policy there. | Data owner and Azure subscription owner | UNDECIDED |  |  |
| G-10 | Review `virtualNetworkAddressPrefix`, `containerAppsSubnetAddressPrefix`, `postgresSubnetAddressPrefix`, and `privateEndpointSubnetAddressPrefix`; prove no overlap with VPN, peered, on-premises, or other enterprise networks. Run M55 preflight on the approved parameter file after the network owner supplies ranges. | Network owner | UNDECIDED |  |  |
| G-11 | Approve resource names, tags, workload/compute/storage/retention/HA settings, and non-production resource-group boundaries. | Azure platform owner | UNDECIDED |  |  |
| G-12 | Approve exact ACR repository names and the private image build/publish runner path. | Release / platform owner | UNDECIDED |  |  |
| G-13 | Define Key Vault secret ownership, managed-identity access, rotation, and audit responsibility without placing secret values in this repository. | Security / platform owner | UNDECIDED |  |  |
| G-14 | Approve DNS and certificates, private DNS zones/links for PostgreSQL, ACR, and Key Vault, frontend edge, API stable hostname, and mobile-client endpoint plan while preserving same-origin web auth and private API/database boundaries. | Network / application owners | UNDECIDED |  |  |
| G-15 | Name operations owners and define alerts, logs/retention, support escalation, incident response, and pilot monitoring. | Operations owner | UNDECIDED |  |  |
| G-16 | Approve a non-production pilot runbook with restore, rollback, migration, and data-integrity checks before any provisioning. | Service / data / release owners | UNDECIDED |  |  |

## 2. Cost Estimate Inputs

Do not record a guessed monthly total. Link a dated estimate prepared with the approved region, service settings, actual usage estimates, currency, and billing agreement. The estimate should include:

- Container Apps CPU/RAM, minimum and maximum replicas, active/idle hours, scaling, and ingress.
- PostgreSQL compute, storage/IOPS, HA mode, backup retention and geography, and growth.
- ACR tier, storage, retained image count, private endpoint, and image pull/build frequency.
- Key Vault, private endpoints, DNS, logging ingestion/retention, alerting, outbound data, and support.
- Existing Render/Vercel costs and unchanged Cloudinary, Firebase, and SMTP spend for comparison.

| Estimate field | Entry |
| --- | --- |
| Status | `UNDECIDED` |
| Safe estimate reference |  |
| Owner and date |  |

## 3. Pilot Go/No-Go Rule

**Current result: NO-GO.** Do not provision the non-production pilot while any required business, data-location/privacy, RPO/RTO, budget, subscription/governance, region/service availability, quota, network overlap, or operations-owner decision remains undecided or rejected.

The M55 checker can validate only the supplied file's literal ACR repository names and internal VNet/subnet structure. It does not establish that a range is authorized, non-overlapping with external networks, available in a subscription, affordable, or approved by an owner.

## 4. Separate Production Gate

Non-production pilot approval does not approve a production migration. A production go/no-go requires separate evidence for:

- Successful migration rehearsal and reconciliation of tenant, audit, payment, receipt, resident-evidence, and media-reference integrity.
- Backup restoration and measured RPO/RTO.
- Same-origin web auth/cookie behavior, private media access, mobile connectivity, RBAC, and tenant-isolation checks from representative networks.
- Accepted notification delivery behavior, throttle behavior, scaling limits, and monitoring.
- Successful non-production canary evidence, a controlled write-freeze/catch-up or separately approved dual-run strategy, rollback owner, staffed monitoring window, and explicit release approval.
- A time-bounded retention/decommission plan for the existing hosting and data stores.

**Production status: NOT APPROVED — no production migration decision is made here.**

## 5. Evidence Handling and Change Log

- Keep this repository copy unfilled until the organization chooses a controlled location for decision evidence.
- Never attach credentials, resident records, database exports, private contact details, or unrestricted billing documents.
- Record changes to owner decisions in the controlled evidence system first; only add a safe reference here after review.

| Date | Change | Authoring role | Evidence reference |
| --- | --- | --- | --- |
| 2026-10-11 | Created blank worksheet. No decisions or approvals recorded. | Codex | M42–M55 task documentation |
