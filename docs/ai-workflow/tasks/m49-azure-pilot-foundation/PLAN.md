# Plan — M49 Azure Non-production Pilot Foundation

## 1. Plan Overview

- **Associated brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target branch:** `infra/m49-azure-pilot-foundation`
- **Base:** M48 checkpoint tree `e049ab0a2f8bdb8b90f16de973dc9c44854169c5`
- **Complexity:** Medium
- **Delivery boundary:** Parameter-required IaC plus compile-only CI. No Azure session or resource operation.

## 2. Milestone Breakdown

### M1 — Record the work contract and verify the isolated baseline

1. Confirm the M49 worktree is clean, on the intended branch, and based on the M48 tree.
2. Read M42's decision gates and M46–M48 follow-up decisions.
3. Record the exact template scope, required inputs, security boundaries, official source references, and verification plan in this packet.
4. Keep the root checkout and `.agents/`, `.codex/`, `.aws/`, and logo/environment assets untouched.

**Validation:** `git status --short --branch`, `git rev-parse HEAD^{tree}`, and task-packet/path checks. No app tests are needed for this planning step.

### M2 — Implement the parameter-required foundation template

1. Add `infra/azure/pilot-foundation/main.bicep`, `targetScope = 'resourceGroup'`.
2. Require the region, names, VNet and subnet ranges, PostgreSQL private DNS zone prefix, PostgreSQL version/compute/storage/backup/HA settings, Log Analytics workspace SKU/retention, ACA zone-redundancy choice and non-empty workload-profile settings, and tags as parameters without deployment defaults.
3. Create a VNet with a dedicated `Microsoft.App/environments` workload-profile subnet and a separate `Microsoft.DBforPostgreSQL/flexibleServers` subnet. Do not select CIDRs or make the subnets overlap by construction.
4. Create and link the PostgreSQL private DNS zone; create a PostgreSQL Flexible Server with private VNet integration and no public endpoint.
5. Create a Log Analytics workspace and an empty external ACA managed environment with explicit logging and environment networking configuration, matching M42's candidate frontend edge. Do not create app resources or application ingress.
6. Mark the administrator password secure, never output credentials, and do not add a sample `.bicepparam` file.
7. Add a README with architecture, destructive/immutable subnet considerations, required M42 approvals, and the limitation of compile-only validation.

**Validation:** Use the pinned local Bicep compiler when available: `az bicep build --file infra/azure/pilot-foundation/main.bicep --stdout`. Do not run `az login`, subscription inspection, deployment, ARM validation, or what-if. Inspect generated ARM JSON through stdout or a temporary path outside the repository; do not commit build output.

### M3 — Add compile-only CI and static contract checks

1. Add a separate workflow job with no Azure credentials and no write permissions; install the exact Bicep compiler version selected in the source reference review.
2. Run only Bicep compilation. Do not run `azure/login`, `az deployment`, `az deployment group validate`, or `what-if`.
3. Add static assertions for `targetScope`, required/no-default parameters, secure password metadata, private network configuration, separate subnets, and the absence of secret outputs or sample values.
4. Keep existing branch and PR triggers and do not make unrelated jobs depend on the new job.

**Validation:** Parse workflow YAML using a parser that preserves the `on` key; run the static assertions; compile Bicep; run `git diff --check`; inspect changed paths and staged state.

### M4 — Self-review and delivery

1. Check the complete diff against every acceptance criterion and scan for accidental app/config/schema/dependency changes and secret values.
2. Record real command outputs and any unverified provider-level criteria in `STATUS.md`.
3. Commit the scoped task packet, IaC, README, and CI job on this branch; preserve ignored documentation explicitly when adding the task packet.
4. Push the branch and open a PR against M48's `test/m48-postgres-dns-reconnect` branch. Do not merge or deploy.
5. Continue to the next independent milestone after confirming the PR state, without waiting for the merge.

**Validation:** `git diff --check`, `git diff --cached --check`, workflow parser/static checks, `az bicep build`, `git status --short --branch`, `git diff --cached --name-only`, complete diff review, remote tree comparison, and hosted CI checks if available.

## 3. Risks and Mitigations

- **Subnet irreversibility / overlap:** No defaults or example values; require explicit prefixes; document review before future deployment; compile-only CI cannot detect overlap.
- **Cloud API drift:** Pin stable resource API versions and Bicep compiler; re-check current official references before future deployment.
- **Credential leakage:** Use `@secure()` on the required admin password; no parameter file, output, or logging; scan generated ARM metadata and source for accidental literals.
- **False deployment confidence:** CI runs compiler only. Explicitly defer subscription/provider `validate` or `what-if` until the user authorizes Azure access and required owners decide the M42 gates.
- **Stacked PR conflict:** Base the branch on the M48 content tree and target the M48 branch; do not retarget to `main` while M48 remains open.

## 4. Completion Checklist

- [ ] M49 template contains only the documented foundation resources and required parameters.
- [ ] No Azure authentication or resource operation was attempted.
- [ ] Compile-only CI and all static checks pass.
- [ ] `STATUS.md` records only checks that actually ran and lists provider-level unknowns.
- [ ] No application, schema, dependency, or production configuration changes occurred.
- [ ] Scoped commit, branch push, and stacked PR are recorded; no merge/deploy was performed.
