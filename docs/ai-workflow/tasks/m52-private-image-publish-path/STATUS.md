# Status — M52 Private Image Build and Publish Path Decision

## 1. Executive Summary

- **Task ID:** `m52-private-image-publish-path`
- **State:** In progress — architecture decision and implementation contract documented; delivery verification pending
- **Current milestone:** M1–M3 complete; M4 in progress
- **Branch:** `infra/m52-private-image-publish-path`
- **Worktree:** `/tmp/gridy-m52-private-image-publish-path`
- **Base content tree:** M51 tree `b455a7a201190fd8325e924701e4d95cbefc6746`
- **Scope:** Documentation-only; no cloud, application, workflow, Bicep, or database operations

## 2. Progress

| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Baseline and scope | Complete | Isolated M51-based worktree; verified M41 image builds, M50 private ACR, M51 identities, current repository metadata, and M42 gates. |
| M2 — Option comparison | Complete | Reviewed current official GitHub and Microsoft documentation for VNet-connected larger runners, ACR Tasks pools, managed identity, OIDC, and self-hosted runner security. |
| M3 — Recommendation and contract | Complete | ADR 015 records a proposed conditional target and a future secure build/publish contract. No account, billing, region, or deployment approval is implied. |
| M4 — Verification and delivery | In progress | Documentation hygiene, scoped commit, remote tree, PR, and hosted checks are being completed. |

## 3. Findings and Recommendation

- M41 already runs test and image-build CI on GitHub-hosted infrastructure; it continues while the laptop is offline. It does not publish images to ACR.
- M50 makes ACR Premium/private-endpoint-only and disables public network access. Microsoft's current guidance says `az acr build` does not work with public network access disabled unless a dedicated agent pool or other documented network allowance is used.
- M51 grants only Container Apps image-pull read access and backend Key Vault read access. There is no CI publisher identity or write role.
- GitHub currently reports `ur1el0/KapitBayan` as public and owned by a personal **User** account. GitHub's Azure private-networking feature for hosted runners is organization-level and plan-gated; larger runners are billed per minute. This is not currently an enabled or approved path for the repository.
- Microsoft currently documents ACR Tasks dedicated agent pools as **preview**, Premium-only, VNet-capable, allocation-billed, and available only in a limited set of regions; the page's current preview list does not include Southeast Asia. Recheck before selecting this option.
- GitHub warns against self-hosted runners for public repositories because fork pull-request code can compromise the runner environment. This is a poor default for the current public repository.
- **Proposed conditional target:** use a GitHub-hosted larger runner connected to an Azure VNet for a release-only image-publish job if repository organization/plan entitlement, subscription, budget, region, network design, and operational ownership are approved. Keep standard public-runner PR CI unprivileged. Use narrowly constrained OIDC, a distinct publisher identity, repository-scoped ABAC write permissions, immutable SHA tags, and digest promotion in a later implementation milestone.
- Do not create or purchase anything as part of M52. If GitHub organization/plan prerequisites are not approved, re-evaluate ACR Tasks and a private runner only after region, cost, and public-repository trust constraints are resolved.

## 4. Decision Gates Kept Open

M42 gates remain open: Azure subscription and billing owner; budget ceiling; permitted data region and backup geography; legal/privacy/data-owner approval; workload size and quota; RPO/RTO; and a named operational owner. Additional M52 implementation gates are GitHub organization/plan entitlement, runner-region/network compatibility, approved ACR repository names, protected release workflow ownership, and the OIDC/ABAC identity contract.

## 5. Verification Log

| Check | Command / evidence | Result |
| --- | --- | --- |
| Hindsight memory | Search/list knowledge pages and capture initiative | UNAVAILABLE: all three calls failed because the local service at `127.0.0.1:9077` refused the connection. No memory claims informed this decision. |
| M51 worktree baseline | `git -C /tmp/gridy-m51-managed-identity-rbac status --short --branch` | PASS: `infra/m51-managed-identity-rbac`, no worktree modifications. |
| M51 latest hosted CI | GitHub Actions run `38145703726` (run #418) and job details | PASS: all eight jobs completed successfully, including backend, frontend, mobile, Docker image builds, migration/DNS smoke checks, and Azure Bicep/ARM contract. This is M51 context, not an M52 code check. |
| Repository account metadata | GitHub repository metadata for `ur1el0/KapitBayan` | PASS: owner type `User`; repository visibility `public`; default branch `main`. |
| Existing CI/image names | `rg -n "docker build|gridy-frontend|gridy-backend|image:" .github/workflows/ci.yml` | PASS: current image tags are `kapitbayan-backend:ci` and `kapitbayan-frontend:ci`; these are local CI tags, not approved ACR repository names. |
| Microsoft/GitHub references | Official pages linked in TASK_BRIEF.md and ADR 015 | PASS: current primary-source pages opened on 2026-10-11; plan/preview/region claims are explicitly time-sensitive. |
| Azure CLI / resource access | No Azure CLI/account/provider commands run | PASS: none were run; no cloud state was queried or changed. |
| M52 diff hygiene | `git diff --check` | Pending final scoped diff. |

## 6. Changed Files

- `architecture/decisions/015-private-acr-image-build-path.md`
- `docs/ai-workflow/tasks/m52-private-image-publish-path/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m52-private-image-publish-path/PLAN.md`
- `docs/ai-workflow/tasks/m52-private-image-publish-path/STATUS.md`

No application, workflow, Bicep, database, dependency, or production configuration file is in scope.

## 7. Remaining Work

- [ ] Run final documentation and Git hygiene checks.
- [ ] Commit only the four scoped documents.
- [ ] Push an equivalent content tree to `infra/m52-private-image-publish-path` parented on the latest remote M51 branch head.
- [ ] Open a PR targeting M51; leave it open and unmerged.
- [ ] Record final local/remote tree and hosted check status.

## 8. Delivery Checkpoint

Pending.
