# M52 — Private Image Build and Publish Path Decision

## 1. Metadata

- **Task ID:** `m52-private-image-publish-path`
- **Task type:** Infrastructure architecture decision and release-pipeline design
- **Branch:** `infra/m52-private-image-publish-path`
- **PR base:** `infra/m51-managed-identity-rbac`
- **Worktree:** `/tmp/gridy-m52-private-image-publish-path`
- **Decision record:** [ADR 015](../../../../architecture/decisions/015-private-acr-image-build-path.md)
- **Date:** 2026-10-11

## 2. Goal

Choose and document a secure, laptop-independent way to build and publish the frontend and backend images to the private Azure Container Registry established in M50, while preserving GitHub Actions as the project’s existing CI system where practical.

The recommendation is conditional. It must distinguish a technically preferred path from a path the current GitHub account and Azure governance have approved.

## 3. Evidence and Current Constraints

- M41 already runs GitHub-hosted CI for branch pushes, including backend, frontend, mobile, and container-image build checks. Those jobs run in GitHub’s cloud and do not depend on the developer laptop being online.
- M50 defines a Premium ACR with a private endpoint and public network access disabled. Microsoft documents that `az acr build` fails when registry public access is disabled unless an approved dedicated agent pool or other network configuration is used.
- M51 assigns a read-only repository-reader role to the Container Apps image-pull identity and a separate Key Vault read role to the backend runtime identity. It creates no CI publisher identity or write role.
- GitHub repository metadata currently reports `ur1el0/KapitBayan` as a public repository owned by a **User** account, not an organization.
- The application image names used by CI are `kapitbayan-frontend` and `kapitbayan-backend`; Azure ACR repository names and registry names have not been provisioned or approved.
- M42’s Azure subscription/billing, budget, region/data-location/privacy, workload sizing/quota, RPO/RTO, and operational-owner gates remain open. No monthly cost estimate or Azure region can be selected from current evidence.

## 4. Scope

This milestone produces a documented decision and implementation contract only:

- Compare supported private build/publish options using current official GitHub and Microsoft documentation.
- Recommend a conditional target that does not require the laptop to remain powered on.
- Document trusted-trigger, image provenance, identity, least-privilege, and registry-network requirements for a later implementation milestone.
- Record the decision and open prerequisites in ADR 015, this task packet, and the M50/M51 handoff context where appropriate.

## 5. Non-Goals and Safety Boundary

- No Azure login, subscription inspection, Bicep deployment, provider validation, `what-if`, resource creation, image publication, or secret creation.
- No GitHub organization creation or transfer, plan upgrade, billing change, Azure budget/resource commitment, runner creation, workflow authentication, or OIDC federation setup.
- No changes to application source, CI workflow, Bicep, database/schema, dependencies, ACR public-network policy, or production hosting.
- No change to the current private ACR boundary and no temporary public access or broad service-tag exception.
- No merge, production deployment, DNS change, or live data operation.

## 6. Architecture Decision to Record

Evaluate these options:

1. **GitHub-hosted larger runner attached to an Azure VNet.** Preferred conditional target if the repository is placed under an eligible GitHub organization/plan, the region is supported, and the budget owner approves per-minute runner costs. Keep ordinary PR CI on standard GitHub-hosted runners. Restrict the private-network runner group to the protected release workflow and publish only trusted protected-branch commits.
2. **ACR Tasks on a dedicated agent pool.** Azure-managed build execution with VNet access and managed identity can keep the build next to ACR. Assess preview status, supported-region list, Premium requirement, pool allocation charges, source-repository trigger model, and how GitHub will gate deployment on a completed, immutable image build. Re-check regional availability before selection.
3. **Self-hosted runner in the Azure VNet.** This works with the current personal-account model but is not recommended for the current public repository: GitHub warns that untrusted pull request code can compromise self-hosted runners. Reconsider only with a separately reviewed trust/visibility and ephemeral-runner design.
4. **Public hosted runner or temporary public ACR access.** Reject for the current M50 contract because a public runner has no private path to the private endpoint and enabling public access would weaken the registry’s explicit network boundary.

ADR 015 must state the preferred conditional path, rejected alternatives, decision status, trade-offs, and the prerequisites that would change the decision. It must not present the proposed path as an approved account, billing, region, or deployment choice.

## 7. Future Pipeline Contract

The later implementation brief must require:

- Separate standard-runner verification from the privileged image-publish job.
- Publish only from a protected trusted branch or an explicitly approved release tag after the relevant tests pass; never publish or expose Azure identity to fork/pull-request code.
- Use immutable commit-SHA tags and record the resulting image digest for each image. Do not use `latest` as the deployment reference; promote the verified digest.
- Use short-lived GitHub OIDC/workload identity federation constrained to the exact repository, trusted ref, and protected environment, or another explicitly reviewed Azure-native identity path. Do not add long-lived Azure client secrets.
- Create a distinct publisher identity. Do not reuse the M51 runtime image-pull or Key Vault identity. Grant only the ABAC-compatible ACR repository write permissions needed for the approved image repositories; do not grant catalog listing or broad subscription/resource-group roles.
- Finalize ACR repository names before adding repository-specific ABAC conditions. Record build provenance and ensure a deployment cannot race ahead of a failed or incomplete image build.
- Preserve ACR public network access as disabled and prove the build agent resolves and reaches the private registry/data endpoints through the intended network path.

## 8. Acceptance Criteria

1. [ ] The task packet records current CI behavior, private ACR constraints, repository owner type/visibility, M51 role separation, and still-open M42 gates with evidence.
2. [ ] The options matrix compares GitHub-hosted VNet runners, ACR Tasks dedicated pools, self-hosted runners, and public-runner/public-ACR access against network fit, account eligibility, security, operations, cost drivers, and limitations.
3. [ ] ADR 015 documents a conditional recommendation, alternatives, consequences, risks, and gates; it does not imply organization transfer, plan purchase, region selection, Azure deployment, or operational approval.
4. [ ] The future build/publish contract covers trusted triggers, PR isolation, immutable tags/digests, identity separation, OIDC constraints, repository-level ABAC, and private endpoint verification.
5. [ ] Official primary-source references and access date are recorded; changing product/region/plan statements are explicitly subject to revalidation before implementation.
6. [ ] This is documentation-only: no Bicep, workflow, app, dependency, migration, or Azure-resource changes.
7. [ ] `git diff --check` passes; scoped local commit and pushed branch have the same content tree; PR targets M51 and stays open/unmerged.
8. [ ] The primary checkout and its untracked agent/environment/logo files remain undisturbed.

## 9. Official References

Reviewed 2026-10-11; confirm current eligibility and availability before a later implementation:

- [ACR private endpoints and `az acr build` limitations](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-private-endpoints)
- [ACR Tasks on a dedicated agent pool](https://learn.microsoft.com/en-us/azure/container-registry/tasks-agent-pools)
- [Managed identity in an ACR Task](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tasks-authentication-managed-identity)
- [Azure private networking for GitHub-hosted runners in an organization](https://docs.github.com/en/organizations/managing-organization-settings/about-azure-private-networking-for-github-hosted-runners-in-your-organization)
- [GitHub-hosted larger runners and billing](https://docs.github.com/en/actions/concepts/runners/larger-runners)
- [GitHub Actions OIDC with Azure](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-azure)
- [GitHub Actions secure use and self-hosted runner risks](https://docs.github.com/en/actions/reference/security/secure-use)
