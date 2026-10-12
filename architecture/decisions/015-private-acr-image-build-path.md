# ADR 015: Private ACR Image Build and Publish Path

- **Date:** 2026-10-11
- **Status:** Proposed — conditional on GitHub account, Azure governance, region, budget, and ownership gates
- **Deciders:** Codex exercising the technical decision authority delegated by the project owner. This does not record GitHub organization/plan, LGU, billing, or data-owner approval.

## Context

M41 already runs GitHub-hosted tests and local image-build checks while the developer laptop is offline, but it does not publish images. M50 makes the Azure Container Registry Premium, private-endpoint-only, and inaccessible from public networks; M51 adds runtime identities for image pull and Key Vault reads, but deliberately adds no publisher identity. The repository is public and currently owned by a personal GitHub account, while Azure budget, region/data-location, and operational ownership gates remain open.

## Decision

For a future release pipeline, **prefer a GitHub-hosted larger runner connected to an Azure VNet**, provided an eligible GitHub organization/plan, a supported runner-network region, subscription and budget approval, and an operational owner are confirmed. Keep ordinary pull-request CI on standard GitHub-hosted runners; restrict the private-network runner group to a protected release workflow that publishes only trusted protected-branch code. This is a proposed target, not authorization to move the repository, purchase a plan, create resources, configure OIDC, or deploy.

The future publisher must use a dedicated identity distinct from the M51 runtime identities, narrowly constrained short-lived federation, repository-specific ABAC write permissions after ACR repository names are approved, immutable commit-SHA image tags, and digest-based promotion. ACR public network access remains disabled.

## Alternatives Considered

### GitHub-hosted larger runners with Azure VNet networking

- **Pros:** Keeps GitHub Actions as the orchestrator, runs independently of the laptop, gives the build job private network access without operating runner VMs, and keeps ordinary PR CI on standard runners.
- **Cons:** GitHub currently documents Azure private networking as organization-level and plan-gated; larger runners incur per-minute charges. The repository is currently user-owned, and account entitlement, budget, region, and VNet costs are unresolved.
- **Why conditional:** It best fits current GitHub workflow and private ACR boundaries if the organization and governance prerequisites are approved. Do not assume the account can use the feature.

### ACR Tasks dedicated agent pool

- **Pros:** Azure-managed pool can attach to a VNet and run builds near the private registry; ACR Task managed identities can access Azure resources without credentials in task steps.
- **Cons:** Microsoft currently documents dedicated agent pools as preview, Premium-only, allocation-billed, and limited to a published set of regions that does not currently include Southeast Asia. The trigger/completion contract between GitHub tests, ACR Task builds, and future deployment needs design and verification.
- **Why not preferred today:** Preview and current region limits conflict with making this the default before the LGU region is selected. Reassess if the service reaches a suitable availability state in the approved region.

### Self-hosted runner in Azure VNet

- **Pros:** Works with a personal repository and offers direct private network reachability; Azure VM managed identity could avoid a static registry credential.
- **Cons:** Requires patching, monitoring, isolation, shutdown/scaling, runner lifecycle, and incident response. GitHub warns that public repository pull requests can compromise self-hosted runner environments.
- **Why not preferred:** The current repository is public. A long-lived or reusable runner with private ACR access presents an avoidable supply-chain boundary risk.

### Public hosted runner or temporary public access to ACR

- **Pros:** Uses the current standard GitHub-hosted runner without additional network configuration.
- **Cons:** The runner cannot reach the private endpoint; allowing public registry access weakens M50's explicit private-only boundary and creates dependence on public-network allow rules.
- **Why rejected:** It contradicts the approved private ACR design. Do not use a broad service-tag or public-access exception as a shortcut.

## Consequences

### Positive

- CI remains laptop-independent and the private registry remains private.
- The image-publishing identity is separated from runtime pull and secret-read identities.
- Untrusted PR validation stays on non-privileged standard runners; only a protected release job receives private network and publishing capability.

### Negative

- The preferred path requires a GitHub organization/plan and runner-network configuration that the current personal repository does not have.
- A larger-runner job and Azure network resources add ongoing cost; there is not enough workload or billing data to estimate it yet.
- Region selection may constrain GitHub runner-network and Azure service availability independently.

### Risks and gates

- **Risk:** A plan or branch trigger grants private network access to untrusted code. **Mitigation:** restrict runner groups to the release workflow; publish only protected trusted refs; use protected environments and an OIDC subject constrained to repository/ref/environment.
- **Risk:** A publisher identity can write outside approved image repositories. **Mitigation:** wait for stable repository names, use the ABAC-compatible writer role with repository conditions, and statically validate identity/role scopes before deployment.
- **Risk:** GitHub networking or ACR Task availability changes. **Mitigation:** re-check official documentation, entitlement, supported regions, quota, and subscription-specific pricing immediately before M53.
- **No-go:** Do not implement or provision the pipeline until M42's named subscription/budget owner, permitted region/data location, privacy approval, RPO/RTO, workload/quota, and operational owner gates are resolved, and GitHub feature entitlement is confirmed.

## References

Reviewed 2026-10-11:

- [ACR private endpoints](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-private-endpoints)
- [ACR Tasks dedicated agent pools](https://learn.microsoft.com/en-us/azure/container-registry/tasks-agent-pools)
- [Managed identity in ACR Tasks](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tasks-authentication-managed-identity)
- [GitHub Azure private networking for hosted runners](https://docs.github.com/en/organizations/managing-organization-settings/about-azure-private-networking-for-github-hosted-runners-in-your-organization)
- [GitHub larger runners](https://docs.github.com/en/actions/concepts/runners/larger-runners)
- [GitHub Actions OIDC with Azure](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-azure)
- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use)
