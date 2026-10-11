# Plan: M53 — Least-Privilege ACR Publisher Identity

## 1. Plan Overview

- **Associated brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target branch:** `infra/m53-acr-publisher-rbac`
- **PR base:** `infra/m52-private-image-publish-path`
- **Worktree:** `/tmp/gridy-m53-acr-publisher-rbac`
- **Base commit/tree:** `5289f472fca6dedfdea59f78f5c899fd49464e5` / `09b5fbde9481c0b618ee98dee9df814c8318a633`
- **Complexity:** Medium
- **Boundary:** Bicep authorization, compiled ARM checker, operator documentation, and task packet only. No Azure or workflow-authentication operation.

## 2. Milestones

### M1 — Confirm baseline and ABAC contract

1. Confirm the M52 worktree/tree and PR #183 remote head are current and equivalent.
2. Inspect M42/M49–M52 constraints, current Bicep resource ordering, checker behavior, pinned CI compile job, and untracked protected paths.
3. Revalidate official Microsoft documentation for the Writer role ID, exact data actions, ABAC condition syntax, and role-assignment Bicep API.
4. Keep backend/frontend repository names as required no-default parameters. Do not infer them from local CI tags.
5. Record local `az`/`bicep` availability; do not log into or query Azure.

**Validation:** Git/status and source inspection, GitHub PR metadata, official documentation, and `command -v az` / `command -v bicep` only.

### M2 — Add publisher identity and conditional writer assignments

1. Add `acrImagePublisherIdentityName`, `acrBackendImageRepositoryName`, and `acrFrontendImageRepositoryName` as required parameters without defaults.
2. Add one tagged user-assigned identity using the existing location/tag parameters.
3. Add exactly two deterministic ACR-scoped role assignments for `Container Registry Repository Writer`, both pointing to the new identity.
4. Put a version-2.0 ABAC condition on each assignment. For each of the four documented Writer data actions, require the request repository name to equal the corresponding exact parameter with `StringEqualsIgnoreCase`.
5. Preserve all M50/M51 resources and roles unchanged. Do not add runner workflow, OIDC, credentials, CI identity federation, or cloud resources.
6. Document that required deployment values must pass a separate ACR repository-name syntax preflight; the Bicep parameter schema supports length constraints but not arbitrary regular-expression validation.

**Validation:** Bicep source review, checker/source assertions, and hosted compile after publication.

### M3 — Extend compiled ARM checker and operator documentation

1. Update the exact parameter/resource inventory for one more identity and two more assignments.
2. Validate publisher identity name/location/tags and uniqueness from runtime identities.
3. Validate exactly two Writer assignments with correct role ID, publisher principal, registry scope, deterministic names, condition version `2.0`, exact repository-name attribute/operator/parameter, and the full four-action gate.
4. Reject unconditioned, prefix/wildcard, malformed, duplicated, cross-wired, broad-scope, or additional role assignments; retain all existing M51 checks.
5. Update README to accurately state the conditional GitHub-hosted VNet runner direction from ADR 015 and describe the new role, required name inputs, identity separation, and unchanged no-cloud boundary.

**Validation:** `python3 -m py_compile`, run existing checker against a fixture only if a trusted compiled template fixture exists; otherwise rely on pinned hosted compile/check and record the limitation. Run workflow contract/static checks and `git diff --check`.

### M4 — Self-review, checkpoint, PR, and hosted verification

1. Review the complete diff against every acceptance criterion. Confirm no forbidden paths, schema/dependency changes, cloud operations, or changes to primary checkout assets.
2. Commit only the task packet, Bicep, checker, and README on the isolated branch.
3. Publish the same content tree to a new remote branch parented on the current remote M52 head; verify tree identity.
4. Open a PR targeting M52, leaving it open/unmerged. Inspect all hosted checks and accurately update STATUS with actual results.
5. Do not merge, deploy, set repository names, configure runner access/OIDC, or publish images.

**Validation:** Python syntax, targeted static contract checks, pinned Bicep compile/ARM checker in CI, `git diff --check`, changed-path list, local/remote tree equality, and final PR checks.

## 3. Risks and Mitigations

- **Condition authoring risk:** An incomplete ABAC action gate can accidentally leave a Writer action registry-wide. Pin every documented data action in both Bicep conditions and the compiled ARM checker; require exact-name equality.
- **Parameter drift risk:** Since actual repository names are not approved, do not set defaults. Require explicit values at deployment and state that they must be reviewed against the image naming contract.
- **Input syntax risk:** The Bicep schema cannot enforce the full ACR repository-name grammar with a regex decorator. The approved deployment task must pre-validate lowercase repository-name syntax before it applies these ABAC conditions; no parameter values or deployment are included here.
- **Role overreach:** Repository Writer includes metadata and content read/write. Explain this data-plane permission set; do not use Contributor, catalog listing, or control-plane roles.
- **Workflow trust risk:** Identity presence alone is not an executable publisher path. M53 adds no OIDC/federation or workflow access. A later milestone must gate credentials on an approved private runner and protected release flow.
- **Unverified provider behavior:** Hosted Bicep compilation proves template typing and static shape only; it does not validate RBAC assignment permission or runtime access. No Azure operation is authorized.

## 4. Plan Amendments

- Baseline confirms README's older “choose a private self-hosted runner or approved private build service” text does not reflect ADR 015's conditional preference for an Azure-VNet-connected GitHub-hosted larger runner. M3 will correct this documentation drift. No other scope changes are planned.
