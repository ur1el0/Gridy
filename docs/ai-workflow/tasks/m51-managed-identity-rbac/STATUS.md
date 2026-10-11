# Status — M51 Managed Identity and Least-Privilege Access Foundation

## 1. Executive Summary

- **Task ID:** `m51-managed-identity-rbac`
- **State:** In progress — identities, scoped role assignments, ARM checker, and README are implemented; hosted compile/contract verification is pending
- **Current milestone:** M1–M3 implemented; M4 verification and delivery in progress
- **Branch:** `infra/m51-managed-identity-rbac`
- **Worktree:** `/tmp/gridy-m51-managed-identity-rbac`
- **Base:** M50 local checkpoint `87ea884`; content tree `f5a947d204c917de05e3f161dbeca42bb8cfdbf8`
- **PR base:** `infra/m50-private-acr-keyvault`; M50 PR #181 remains open and unmerged

## 2. Progress

| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Baseline and role model | Complete | M50 is clean locally and its implementation CI passed. Microsoft Learn sources were reviewed. No Azure login or resource operation was run. |
| M2 — Identities and assignments | Implemented | Added separate ACR image-pull and backend runtime identities with registry/vault-scoped read-role assignments. |
| M3 — ARM contract and README | Implemented | Checker expects exactly 23 resources and validates ACR mode, role IDs, principals, scopes, and prohibited resource types; README records access limits. |
| M4 — Verification and delivery | In progress | Local source/syntax/diff checks pass; hosted compilation and the expanded ARM checker are required before delivery. |

## 3. Decisions and Constraints

- ACR will explicitly use `AbacRepositoryPermissions`; legacy `AcrPull` will not be used.
- The image-pull identity will receive the built-in `Container Registry Repository Reader` role at the ACR scope. No catalog listing, write, delete, or control-plane role is planned.
- Until image repository names are approved, the read role is not constrained with repository-level ABAC conditions; it therefore applies across the dedicated ACR. This limitation will be visible in operator documentation.
- A separate backend runtime identity will receive `Key Vault Secrets User` at Key Vault scope. The Key Vault remains empty; no frontend or CI identity receives access.
- No app resources, CI identity, federated credentials, Azure login, provider validation, `what-if`, deployment, images, secret values, migrations, application changes, or dependencies are in scope.
- M42 governance and deployment gates remain open.
- Hindsight search/list and initiative capture were attempted; the local service refused connections at `127.0.0.1:9077`, so no page content was available.
- Microsoft Learn sources were reviewed on 2026-10-11; source links and current role-model rationale are recorded in TASK_BRIEF.md and PLAN.md.
- M51 Bicep, checker, README, and planning packet are the only changed paths. No application, schema, dependency, or workflow authentication changes are included.

## 4. Files Changed or Created

Planning packet and implementation files:

- `docs/ai-workflow/tasks/m51-managed-identity-rbac/TASK_BRIEF.md`
- `docs/ai-workflow/tasks/m51-managed-identity-rbac/PLAN.md`
- `docs/ai-workflow/tasks/m51-managed-identity-rbac/STATUS.md`
- `infra/azure/pilot-foundation/main.bicep`
- `infra/azure/pilot-foundation/README.md`
- `scripts/ci/check-azure-pilot-foundation.py`

No CI workflow authentication, application, schema, or dependency source files have been changed.

## 5. Verification Log

| Check | Command / evidence | Result |
| --- | --- | --- |
| M50 parent | Local Git and remote M50 PR #181 | PASS: local and remote M50 content tree is `f5a947d204c917de05e3f161dbeca42bb8cfdbf8`; M50 PR remains open/unmerged. |
| M50 implementation CI | GitHub Actions run `38144220353` (run #405) | PASS: all eight jobs succeeded on implementation commit `09c5abf811c88898b149c27f047bb1fa774215d0`. |
| M50 status checkpoint CI | GitHub Actions run `38144614206` (run #407) | PASS: all eight jobs completed successfully after the status-only M50 checkpoint. |
| Hindsight | Search/list/capture | UNAVAILABLE: connection refused at `127.0.0.1:9077`; no memory content returned. |
| Azure CLI / Bicep | `command -v az`; `command -v bicep` | UNAVAILABLE locally; do not use authenticated or provider operations. |
| Bicep source contract | Python assertions over `main.bicep` | PASS: 23 declarations (M50's 19 plus two identities and two role assignments), explicit ACR ABAC mode, and exact role IDs. |
| Checker syntax | `python3 -m py_compile scripts/ci/check-azure-pilot-foundation.py` | PASS. |
| First hosted M51 compile/check | GitHub Actions run `38145007304`, Azure foundation Bicep compile job | FAIL: compiler warned that ACR API `2025-04-01` did not model `roleAssignmentMode`; ARM checker did not expand Bicep variables containing the role GUIDs. Updated the ACR API to the documented `2025-11-01` schema and added safe variable expansion to the checker; rerun required. |
| Diff hygiene | `git diff --check && git diff --cached --check` | PASS at the implementation checkpoint; no trailing whitespace found. |
| Primary checkout | Read-only tracked status inspection | PASS: no tracked changes caused by M51 setup. Existing untracked agent/environment and logo assets are preserved. |
| Scope review | Git staged and unstaged path inspection | PASS: only the three M51 task documents, pilot Bicep/README, and ARM checker are changed. |

## 6. Remaining Work and Unverified Items

- [x] Confirm all eight jobs passed on M50 status-only checkpoint run `38144614206`.
- [ ] Pass hosted Bicep v0.47.16 compilation and ARM contract check.
- [ ] Verify changed paths, no Azure operations, no app/schema/dependency changes, and clean diff.
- [ ] Commit and publish an equivalent M51 tree parented on the latest remote M50 head; open PR targeting M50.
- Azure provider availability, assignment permissions, RBAC propagation, private DNS resolution, image-pull behavior, secret access, cost, and deployment remain unverified by design.
