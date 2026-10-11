# M56 — Azure Pilot Go/No-Go Evidence Worksheet

## 1. Metadata

- **Task ID:** `m56-azure-pilot-go-no-go`
- **Task type:** Documentation and decision-gate readiness
- **Lead / writer / implementer / reviewer:** Codex (user-directed sole-agent mode)
- **Branch:** `infra/m56-azure-pilot-go-no-go`
- **Worktree:** `/tmp/gridy-m56-azure-pilot-go-no-go`
- **Base local commit/tree:** `e7c5ee07c08c67135b447c3f46a93d0134759b33` / `0ad05acaf9322eb9ea49426dbbb750c9981a4bf3`
- **Intended PR base:** `infra/m55-azure-network-parameter-preflight` (PR #186, open and unmerged)
- **Date:** 2026-10-11

## 2. Objective and Scope

Turn the unresolved M42 Azure pilot business, data, network, cost, and operational gates into a fillable evidence worksheet that clearly distinguishes recorded evidence from approval and cannot imply Azure access or deployment authorization.

### In scope

- Add a worksheet to this task packet for accountable owner roles, decisions, evidence references, dates, and explicit statuses.
- Cover M42 Phase 0 go/no-go inputs and the additional technical inputs required by the M49–M55 parameter-required foundation and offline preflights.
- Record the boundaries between a non-production pilot decision and a separate production cutover decision.
- Keep the worksheet blank and all decisions `UNDECIDED`; do not enter guessed or synthetic production values.

### Non-goals

- Do not choose or approve an Azure region, subscription, CIDR, service SKU, quota, resource name, budget, RPO/RTO, data location, or legal/privacy position.
- Do not access Azure, Render, Vercel, production data, billing systems, provider accounts, DNS, or credentials.
- Do not create deployment parameters, modify infrastructure source, CI, app source, database/schema, dependencies, secrets, or production settings.
- Do not mark an M42 gate approved or authorize provisioning, migration, production cutover, or decommissioning.

## 3. Current State and Evidence

- M42's audit recommends only a non-production pilot after business and account prerequisites; it states a no-go if there is no named budget owner, accepted data-location decision, agreed RPO/RTO, or material organizational/operational benefit.
- M42 leaves workload facts, data-owner/legal review, pricing inputs, service availability, and production cutover decisions unverified.
- M49 requires deployment choices as explicit Bicep parameters without defaults and does not include a sample parameter file.
- M50–M53 add private ACR/Key Vault and least-privilege identity/RBAC infrastructure without Azure operations or image publication.
- M54 validates repository-name syntax; M55 validates CIDR syntax, subnet containment/overlap, minimum subnet sizes, and ACA reserved ranges. These offline checks cannot verify subscription policy, service availability/quota, or overlap with connected/on-premises networks.
- The M42 evidence is repository and Microsoft-documentation review, not approval from an LGU/data owner, account owner, finance owner, network owner, or legal/privacy authority.

## 4. Required Rules

- Keep all decision statuses `UNDECIDED` until the responsible owner supplies a decision and traceable evidence.
- A filled worksheet is evidence organization only; it is not an Azure authorization, release approval, or legal determination.
- Do not put credentials, secrets, resident data, subscription identifiers, private contact information, or unrestricted billing exports in this tracked worksheet. Refer to controlled evidence by a safe artifact name or restricted location.
- Distinguish pilot gates from production gates. No successful compile, unit test, preflight, preview, or PR can satisfy an external owner approval.
- Preserve M42 requirements for same-origin web routing, private database access, resident evidence security, tenant isolation, RBAC, payment/audit integrity, and rollback.
- Preserve ADR 009: do not introduce Celery/Redis or silently change best-effort notification and per-process throttling behavior.

## 5. Observable Acceptance Criteria

1. [x] The worksheet contains every M42 Phase 0 prerequisite: subscription/governance/support owner, workload facts, LGU/data-owner/legal location and evidence sign-off, RPO/RTO, and comparable cost inputs.
2. [x] It records the additional deployment inputs from M49–M55, including service/region/SKU/quota evidence, resource settings, all four network prefixes, external-network overlap review, private DNS, ACR repository names, and secret/identity ownership.
3. [x] Each gate has a responsible owner role, decision, status, evidence reference, and decision date; every initial status is `UNDECIDED` and no values are guessed.
4. [x] Explicit no-go rules prevent pilot provisioning when required business, data-location, RPO/RTO, budget, subscription, network, or service-availability evidence is missing.
5. [x] A separate production gate covers migration rehearsal, integrity verification, tested restore/rollback, canary, monitoring, and release approval; pilot readiness cannot imply production readiness.
6. [x] The worksheet contains no credentials, resident data, real deployment parameters, or actual unapproved cloud values.
7. [x] The change is documentation-only; no Azure/provider operation, source/config/schema/dependency change, or protected-primary-checkout modification occurs.
8. [x] `git diff --check` and a scoped Markdown whitespace/link/path review pass; actual outcomes are recorded in STATUS.md.
9. [x] The scoped branch is pushed and a PR is opened against M55's branch; leave the PR open and unmerged.

## 6. Relevant Files

- `docs/ai-workflow/tasks/m42-azure-migration-readiness/AUDIT.md`
- `docs/ai-workflow/tasks/m49-azure-pilot-foundation/{TASK_BRIEF.md,PLAN.md}`
- `docs/ai-workflow/tasks/m50-private-acr-keyvault/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m51-managed-identity-rbac/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m52-private-image-publish-path/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m53-acr-publisher-rbac/PLAN.md`
- `docs/ai-workflow/tasks/m54-acr-repository-preflight/STATUS.md`
- `docs/ai-workflow/tasks/m55-azure-network-parameter-preflight/{TASK_BRIEF.md,STATUS.md}`
- New M56 `DECISION_WORKSHEET.md`, `TASK_BRIEF.md`, `PLAN.md`, and `STATUS.md`

## 7. Risks and Mitigations

- **False approval:** use explicit `UNDECIDED` statuses, named owner roles, and evidence references; never infer approval from technical checks.
- **Sensitive evidence disclosure:** store only redacted artifact references in tracked documentation and keep sensitive evidence in an owner-controlled system.
- **Scope drift into deployment:** keep this task documentation-only and leave all M42 provisioning and production gates closed.
