# Plan — M56 Azure Pilot Go/No-Go Evidence Worksheet

## 1. Plan Overview

- **Associated brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target branch:** `infra/m56-azure-pilot-go-no-go`
- **Worktree:** `/tmp/gridy-m56-azure-pilot-go-no-go`
- **Base:** M55 local status checkpoint `e7c5ee07c08c67135b447c3f46a93d0134759b33`, tree `0ad05acaf9322eb9ea49426dbbb750c9981a4bf3`
- **PR base:** `infra/m55-azure-network-parameter-preflight`
- **Complexity:** Low
- **Boundary:** Documentation-only. No source, CI, template, parameter, or cloud changes.

## 2. Milestones

### M1 — Reconcile existing gates

1. Read M42's Phase 0, Phase 1 and later phase gates, plus M49–M55 contracts.
2. Map each required business decision, operational input, technical parameter, evidence owner, and no-go rule to its existing source document.
3. Mark which questions are pilot prerequisites versus production-only gates; do not resolve any question.

**Validation:** Source path review and task packet consistency review.

### M2 — Draft the fillable worksheet

1. Add a decision register with owner role, required decision, evidence reference, status, and date fields.
2. Cover subscription/governance, workload, data location/privacy, RPO/RTO, cost, region/service availability, sizing, network/CIDR/external overlap, secrets/identity, notifications/throttling, operations, migration, and rollback.
3. Start all statuses as `UNDECIDED`; leave actual values blank and include a safe-evidence handling note.
4. State that completing the worksheet does not grant Azure authorization or satisfy separate production release approval.

**Validation:** Each worksheet row traces to an M42–M55 source and acceptance criteria; inspect for actual or example deployment values and secrets.

### M3 — Self-review and delivery

1. Review the worksheet against every task acceptance criterion and make sure no external approval is asserted.
2. Run `git diff --check` and scoped Markdown whitespace and relative-link checks.
3. Commit only the four M56 documentation files, publish a matching tree under the M55 remote branch, and open a stacked PR targeting M55.
4. Inspect hosted CI and preview status. Leave the PR open and unmerged; do not perform Azure operations.

**Validation:** Scoped file list, clean worktree/index, remote tree identity, PR state, hosted CI, preview status, and primary-checkout status.

## 3. Risks and Mitigations

- **Repeated M42 content:** link to existing decisions and use the worksheet for owner/evidence/status capture rather than rewriting technical findings.
- **Stale cloud facts:** mark region/SKU/quota evidence as requiring revalidation against current Microsoft docs and the selected subscription when an owner makes a decision.
- **Confidentiality:** do not embed actual identifiers, resident details, secrets, or unrestricted finance documents.
- **Authorization confusion:** keep all entries undecided and state the separate authorization needed for any cloud action.

## 4. Plan Amendments

- None.
