# Status — M51 Managed Identity and Least-Privilege Access Foundation

## 1. Executive Summary

- **Task ID:** `m51-managed-identity-rbac`
- **State:** Complete — Bicep compile, ARM contract check, and all eight hosted CI jobs pass; PR #182 is open and unmerged
- **Current milestone:** M1–M4 complete; Azure provider validation and deployment gates remain unverified by design
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
| M4 — Verification and delivery | Complete | M51 is committed and pushed, PR #182 targets M50, and all eight hosted jobs pass on remote commit `21130676e6e443bafe6f82b869738550cd73e517`. No merge or Azure operation occurred. |

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
- The local implementation commits are `94d5a8cbd6dbb8a08fe0ca1452afc9f6b73d0aa3`, `b79b08b`, `13de1d775de9d0bd4ee4abde3c85779b1bb35a50`, `06923d24c60ef94d0d557b3381b4a3da67b8d7db`, and `2767a7001bdbbee3b0fa4137f4c26555d035e1d4`; the remote branch has equivalent content with M50 as its direct parent.

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
| Second hosted M51 compile/check | GitHub Actions run `38145171147`, Azure foundation Bicep compile job | FAIL: Bicep compiled cleanly with ACR API `2025-11-01`, but the checker rejected the compiled identity-principal expression. Added the expression to the diagnostic so the next compile run reveals the exact emitted form; hosted rerun required. |
| Third hosted M51 compile/check | GitHub Actions run `38145272966`, Azure foundation Bicep compile job | FAIL: compiler emitted `[reference('acrimagepullidentity').principalId]`; the checker expected the identity parameter name. Updated the checker to compare against the exact symbolic resource reference for each role so cross-wired identities still fail; hosted rerun required. |
| Final M51 Bicep compile and ARM contract | GitHub Actions run `38145364410` (run #416), Azure foundation Bicep compile job | PASS on PR #182 source commit `21130676e6e443bafe6f82b869738550cd73e517`. Exact checker output: `PASS: required parameters, private ACR/Key Vault, separate managed identities, exactly scoped read roles, private endpoints/DNS, and no-app/no-secret/no-output boundary verified.` |
| Final hosted CI | GitHub Actions run `38145364410` (run #416) | PASS: all eight jobs completed successfully — backend tests, frontend tests, mobile tests, frontend image, backend image, Compose migration gate smoke, PostgreSQL DNS reconnect smoke, and Azure foundation Bicep compile/ARM contract. |
| Diff hygiene | `git diff --check && git diff --cached --check` | PASS at the implementation checkpoint; no trailing whitespace found. |
| Primary checkout | Read-only tracked status inspection | PASS: no tracked changes caused by M51 setup. Existing untracked agent/environment and logo assets are preserved. |
| Scope review | Git staged and unstaged path inspection | PASS: only the three M51 task documents, pilot Bicep/README, and ARM checker are changed. |

## 6. Remaining Work and Unverified Items

- [x] Confirm all eight jobs passed on M50 status-only checkpoint run `38144614206`.
- [x] Pass hosted Bicep v0.47.16 compilation and ARM contract check.
- [x] Verify changed paths, no Azure operations, no app/schema/dependency changes, and clean diff.
- [x] Commit and publish an equivalent M51 tree parented on the latest remote M50 head; open PR #182 targeting M50.
- Azure provider availability, assignment permissions, RBAC propagation, private DNS resolution, image-pull behavior, secret access, cost, and deployment remain unverified by design.

## 7. Delivery Checkpoint

- **Local head:** `2767a7001bdbbee3b0fa4137f4c26555d035e1d4`; local tree before this status-only checkpoint: `86542aea12bbec2ec6c2301f1eb0e5ef09d960fc`.
- **Remote implementation commit:** `21130676e6e443bafe6f82b869738550cd73e517`, parented on M50 head `c698166fa04f4ff30d03930a37de544c4726a57d`; same content tree `86542aea12bbec2ec6c2301f1eb0e5ef09d960fc`.
- **PR:** [#182](https://github.com/ur1el0/KapitBayan/pull/182), open and unmerged, targeting `infra/m50-private-acr-keyvault`.
- **Hosted CI:** run `38145364410` passed all eight jobs on the implementation commit before this status-only checkpoint.
- **Scope:** no Azure login, subscription/provider validation, `what-if`, deployment, image publication, secret writes, merge, or production change.
