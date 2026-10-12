# Plan: M52 — Private Image Build and Publish Path Decision

## 1. Plan Overview

- **Associated brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Decision record:** [ADR 015](../../../../architecture/decisions/015-private-acr-image-build-path.md)
- **Target branch:** `infra/m52-private-image-publish-path`
- **PR base:** `infra/m51-managed-identity-rbac`
- **Worktree:** `/tmp/gridy-m52-private-image-publish-path`
- **Base content tree:** M51 tree `b455a7a201190fd8325e924701e4d95cbefc6746`
- **Complexity:** Medium
- **Implementation boundary:** Documentation only. Do not modify application, CI, Bicep, or cloud-resource files.

## 2. Milestones

### M1 — Confirm baseline and scope

1. Verify the isolated M51 worktree, branch, clean status, task files, M51 PR base, and final hosted CI state.
2. Confirm repository owner type and visibility from GitHub repository metadata.
3. Inspect M41 CI image builds, M50 private registry networking, M51 identity scopes, and M42's remaining decision gates.
4. Record that M41 already runs remote checks when the laptop is offline; M52 specifically addresses publishing into private ACR.

**Validation:** `git status --short --branch`, targeted source/document inspection, GitHub metadata/branch checks, and protected-primary-checkout status inspection.

### M2 — Compare private image-build options

1. Review current official GitHub and Microsoft documentation for Azure VNet-connected GitHub-hosted runners, ACR Tasks agent pools, ACR managed identity, OIDC, and self-hosted runner security.
2. Compare options by network reachability, current account/plan compatibility, supply-chain isolation, operational burden, cost drivers, and regional/service limitations.
3. Keep any changing plan, availability, preview, and region statements dated and mark them for revalidation before implementation.
4. Reject temporary ACR public access because it contradicts M50's no-public-network contract.

**Validation:** Open each primary-source page and record its URL/access date; cross-check claims against the current repo metadata and M42/M50/M51 documents.

### M3 — Record a conditional recommendation and implementation contract

1. Write ADR 015 with a conditional preference for GitHub-hosted larger runners on an Azure VNet, while making the GitHub organization/plan, region, budget, and owner gates explicit.
2. Record ACR Tasks as a viable alternative only if its preview, pool-region, cost, and orchestration limitations are acceptable at implementation time.
3. Document why a self-hosted runner is a poor default for the current public repository and why a public registry exception is rejected.
4. Specify trusted triggers, digest-based promotion, identity separation, OIDC constraints, repository-specific ABAC, and private endpoint tests for the later implementation task.
5. Keep the ADR status proposed until account/budget/region approvals are available; do not create cloud resources or workflow credentials.

**Validation:** Review the acceptance matrix in TASK_BRIEF.md and cross-check the proposal against M42, M50, and M51 without changing their files.

### M4 — Documentation verification and delivery

1. Run `git diff --check` and inspect the complete scoped diff and changed-path list.
2. Confirm zero application, workflow, Bicep, dependency, database, and Azure resource changes.
3. Confirm M51's latest hosted run completed successfully and record its run URL/status as context, not as M52-specific verification.
4. Commit the scoped task packet and ADR locally; publish an equivalent tree whose parent is the current remote M51 branch head.
5. Open a PR targeting `infra/m51-managed-identity-rbac`, record the link/status, and leave it unmerged.

**Validation:** `git diff --check`, `git diff --cached --check`, `git diff --name-only`, `git diff --cached --name-only`, `git status --short --branch`, remote/local tree comparison, and hosted PR checks if they run.

## 3. Required Content Matrix

| Option | Private ACR network fit | Current eligibility | Security / operations | Cost and limitations |
| --- | --- | --- | --- | --- |
| GitHub-hosted larger runner with Azure VNet | Direct VNet path to private endpoint | Requires an eligible GitHub organization/plan; current owner is a User account | GitHub-managed runner; isolate the release workflow and protect trusted refs | Per-minute larger-runner billing plus Azure VNet/network resources; region support must match the chosen topology |
| ACR Tasks dedicated agent pool | Azure-managed pool can attach to a VNet | Requires Premium ACR; currently documented as preview with a limited region list | Managed identity can avoid task credentials; event/orchestration contract needs design | Pool allocation billing; preview and region availability may conflict with the selected application region |
| Self-hosted Azure runner | Direct VNet path to private endpoint | Works with current personal repository ownership | Ongoing patching/isolation burden; unsafe default for a public repo because fork PR code may compromise the runner | VM/scale-set operation and monitoring; potential idle capacity or scale automation cost |
| Public runner / public ACR exception | No private endpoint path from standard public runner | Technically easy only if network boundary is weakened | Exposes registry path to public network rules and untrusted workflow risk | Rejected because it conflicts with M50's private-only design |

## 4. Risks and Rollback

- A conditional architecture recommendation is not proof of GitHub plan entitlement, regional availability, or Azure provider support. Revalidate those facts before implementation.
- GitHub-hosted private networking currently requires an organization-level setup; the repository is owned by a personal account. Moving it or purchasing a plan is outside this task.
- ACR dedicated agent pools are documented as preview with a limited region list. A future region decision may make them unavailable or unsuitable.
- Any privileged build workflow could publish untrusted code if the trigger, branch protection, runner-group restrictions, environment protection, or OIDC subject is too broad. The later implementation must test these boundaries.
- No cloud or source configuration is modified here. Rollback is reverting this isolated documentation branch.

## 5. Plan Amendments

- None at baseline. If official documentation or current repository metadata contradicts the assumptions, update the option matrix before recording the ADR recommendation.
