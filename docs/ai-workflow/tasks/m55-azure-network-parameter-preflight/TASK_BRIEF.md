# M55 — Azure Pilot Network Parameter Preflight

## 1. Metadata

- **Task ID:** `m55-azure-network-parameter-preflight`
- **Task type:** Infrastructure tooling and verification
- **Branch:** `infra/m55-azure-network-parameter-preflight`
- **PR base:** `infra/m54-acr-repository-preflight`
- **Worktree:** `/tmp/gridy-m55-azure-network-parameter-preflight`
- **Base local commit/tree:** `9fec41114b8348be0803d617bb478a5271fc7163` / `0d8eb69566dac4bfe77e5acbdfd433c6765c299b`
- **Date:** 2026-10-11

## 2. Goal

Add an offline preflight for the four IPv4 network parameters in the Azure pilot ARM JSON parameter file, building on M54's ACR repository-name validation. It must catch malformed ranges, out-of-VNet subnets, internal subnet overlap, documented reserved-range overlap for Container Apps, and undersized ACA/PostgreSQL subnets before any deployment is authorized.

## 3. Evidence and Context

- M54 adds `scripts/ci/check_acr_repository_parameters.py`, which safely parses ARM JSON, rejects duplicate keys, validates both required ACR repository parameters, and avoids printing parameter values.
- `infra/azure/pilot-foundation/main.bicep` requires `virtualNetworkAddressPrefix`, `containerAppsSubnetAddressPrefix`, `postgresSubnetAddressPrefix`, and `privateEndpointSubnetAddressPrefix` as explicit strings. Its descriptions warn that subnet prefixes must not overlap and that ACA subnet sizing is immutable after environment creation.
- M42 leaves network ownership, selected CIDRs, and external/on-premises overlap review open. The offline check can verify only the ranges in the supplied file; it cannot see connected networks or subscription policy.
- Microsoft Learn currently documents `/27` as the minimum subnet size for workload-profile Container Apps and `/28` as the smallest PostgreSQL Flexible Server delegated subnet. The Container Apps networking page lists reserved ranges that its workload-profile subnet must avoid. These constraints and source URLs will be recorded in this packet and README.
- Hindsight search/list remains unavailable at the local service endpoint; no memory claims informed this task.

## 4. Scope

- Add a Python standard-library CLI that accepts the same ARM JSON parameter file as M54.
- Require the two M54 repository parameters and validate them with M54's existing rules.
- Require literal string values for the VNet prefix and three subnet prefixes; parse strict IPv4 CIDRs only.
- Require each subnet to be contained in the VNet, and all three subnets to be pairwise non-overlapping.
- Enforce `/27` or larger address capacity for the workload-profile ACA subnet and `/28` or larger capacity for the PostgreSQL subnet.
- Reject ACA subnet overlap with the current Microsoft-documented reserved ranges.
- Keep all diagnostics value-free; test using inline synthetic values and temporary files, not a committed deployment parameter file.
- Add stdlib unit tests, a dedicated unprivileged Python 3.12 CI job, and README usage and limitations.

## 5. Non-Goals and Safety Boundary

- No Azure login, account/resource query, provider validation, `what-if`, deployment, role assignment, or resource operation.
- No selected region, CIDR, resource name, or parameter default; no `.bicepparam`/ARM deployment values committed.
- No DNS, VPN, peering, on-premises, or other subscription-network inventory. The user/data/network owner must review external overlap.
- No validation of region/SKU availability, quota, budget, owner approval, data residency, RPO/RTO, address capacity beyond documented minimums, or M42 gates.
- No application, database/schema, production configuration, dependency, or Azure template resource changes.
- No merge. Keep the stacked PR open and unmerged.

## 6. Observable Acceptance Criteria

1. [x] The CLI validates M54's backend/frontend repository parameters and requires literal string values for the VNet plus three subnet CIDRs.
2. [x] It accepts only strict IPv4 network notation and rejects malformed values or host bits.
3. [x] Every subnet is contained by the VNet, and the three subnet ranges are pairwise non-overlapping.
4. [x] The workload-profile ACA subnet is at least `/27`, the PostgreSQL subnet at least `/28`, and the ACA subnet does not overlap Microsoft-documented reserved ranges.
5. [x] Errors identify the failing parameter/rule without printing the supplied prefix, repository names, or unrelated parameter contents.
6. [x] Tests cover valid ranges, invalid syntax, containment, overlap, size boundaries, reserved ranges, malformed/duplicate JSON, required parameter shapes, and output redaction.
7. [x] A dedicated Python 3.12 CI job runs these tests without Azure authentication/deployment. The existing Bicep compile job remains unchanged.
8. [x] README documents the combined offline check and limitations; no deployment parameters are committed.
9. [x] No Azure operation, schema/dependency change, or protected-primary-checkout modification occurs.

## 7. Relevant Files

- `scripts/ci/check_acr_repository_parameters.py`
- `scripts/ci/check_azure_pilot_parameters.py`
- `scripts/ci/test_azure_pilot_parameters.py`
- `.github/workflows/ci.yml`
- `infra/azure/pilot-foundation/README.md`
- `docs/ai-workflow/tasks/m55-azure-network-parameter-preflight/{TASK_BRIEF.md,PLAN.md,STATUS.md}`

## 8. References

Reviewed 2026-10-11:

- [Microsoft Learn: Container Apps networking](https://learn.microsoft.com/en-us/azure/container-apps/networking?tabs=arm-template) — workload-profile `/27` minimum and reserved subnet ranges.
- [Microsoft Learn: PostgreSQL Flexible Server private networking](https://learn.microsoft.com/en-us/azure/postgresql/network/concepts-networking-private) — delegated subnet minimum `/28`.
- [Microsoft Learn: Plan Azure virtual networks](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-vnet-plan-design-arm) — subnet containment and no overlapping subnet prefixes.
- [Microsoft Learn: Azure VNet concepts and best practices](https://learn.microsoft.com/en-us/azure/virtual-network/concepts-and-best-practices) — avoid overlap with external connected networks (requires owner inventory outside this tool).
