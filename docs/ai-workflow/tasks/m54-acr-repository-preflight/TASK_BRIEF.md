# M54 — ACR Repository Parameter Preflight

## 1. Metadata

- **Task ID:** `m54-acr-repository-preflight`
- **Task type:** Infrastructure tooling and verification
- **Branch:** `infra/m54-acr-repository-preflight`
- **PR base:** `infra/m53-acr-publisher-rbac` (PR #184 remains open and unmerged)
- **Worktree:** `/tmp/gridy-m54-acr-repository-preflight`
- **Base commit/tree:** local `7d50e11b44d21ca50c4379b5f2cb632b7e6c56b9` / `9b99912759060e093ed5fdee2ace9dceb29c5980`
- **Date:** 2026-10-11

## 2. Goal

Add an offline preflight command that validates the backend and frontend ACR repository-name values in the exact JSON deployment parameter file before a future authorized deployment consumes M53's ABAC conditions.

The preflight validates syntax and input shape only. It does not select repository names, prove that Azure accepts or provisions them, or authorize deployment.

## 3. Evidence and Context

- M53 adds required, no-default Bicep parameters `acrBackendImageRepositoryName` and `acrFrontendImageRepositoryName`; Bicep enforces non-empty values but not the complete repository-name syntax.
- `infra/azure/pilot-foundation/README.md` says invalid characters must be rejected before the ABAC conditions are materialized. No deployment wrapper or parameter-file values currently exist.
- Microsoft documents ACR repository names as lowercase alphanumeric characters, periods, dashes, underscores, and forward slashes, and supports slash-delimited namespaces.
- Docker Distribution's reference grammar provides a conservative Docker-compatible component shape and caps repository path length at 255 characters. M54 will use this stricter interoperable subset so values also form valid Docker image references. To avoid interpreting a full image reference as a repository value, a first path component containing a dot or equal to `localhost` followed by `/` is rejected; this intentionally excludes some otherwise valid dotted top-level namespaces.
- The two repository names have not been approved. No example parameter file containing concrete values will be committed.

## 4. Scope

- Add a Python standard-library CLI that reads an ARM JSON deployment parameter file and validates both M53 repository parameters as literal string values.
- Reject malformed JSON, duplicate JSON keys, missing or incorrectly shaped parameters, non-string/reference values, empty or non-canonical names, invalid path components, tags/digests/registry prefixes, overlong names, and identical backend/frontend values.
- Ensure diagnostics identify the field and failure reason without echoing supplied values or unrelated parameter content.
- Add unit tests using temporary fixture files and run them in a dedicated standard Python CI job; keep the Bicep compile job unchanged.
- Update the Azure foundation README with the exact local command and its limits.
- Record sources, verification, and delivery in this task packet.

## 5. Non-Goals and Safety Boundary

- No Azure login, subscription/resource query, provider validation, `what-if`, deployment, role assignment, or resource operation.
- No image build/push, GitHub OIDC/federation, runner/network, workflow authentication, secret, or repository-name selection.
- No committed `.bicepparam` or JSON parameter file containing guessed values.
- No Bicep role/resource changes, application/schema/dependency changes, production host changes, or changes to M42 governance approvals.
- No merge or production deployment. PR remains open and unmerged.

## 6. Observable Acceptance Criteria

1. [ ] A standard-library preflight reads the supplied ARM JSON parameter file and requires both M53 repository-name fields to contain literal non-empty strings.
2. [ ] It accepts valid nested Docker-compatible repository names using lowercase ASCII alphanumeric path components and allowed separators, with a total maximum length of 255 characters; it rejects dotted or `localhost` host-like prefixes followed by `/`.
3. [ ] It rejects uppercase, whitespace, empty components, leading/trailing separators, invalid characters, registry hosts, tags, digests, names over 255 characters, and equal backend/frontend names.
4. [ ] It rejects duplicate JSON object keys and malformed/missing/wrongly typed parameter structures; it never prints supplied values.
5. [ ] Unit tests cover valid input, invalid syntax/boundaries, malformed/duplicate JSON, parameter shape errors, CLI exit behavior, and diagnostic value redaction.
6. [ ] A dedicated Python 3.12 CI job runs the new tests without Azure authentication or deployment; the existing Bicep compile job is unchanged and the full CI matrix remains green.
7. [ ] README gives the exact command against the same JSON parameter file intended for a future deployment and states that syntax validation does not satisfy Azure governance or provider checks.
8. [ ] No Azure operations, schema changes, dependency additions, committed concrete parameter values, or protected-primary-checkout changes occur.

## 7. Relevant Files

- `infra/azure/pilot-foundation/README.md`
- `.github/workflows/ci.yml`
- `scripts/ci/check_acr_repository_parameters.py`
- `scripts/ci/test_acr_repository_parameters.py`
- `docs/ai-workflow/tasks/m54-acr-repository-preflight/{TASK_BRIEF.md,PLAN.md,STATUS.md}`

## 8. Constraints and Risks

- The preflight must validate the repository *path* only; a registry login server, tag, digest, or full image reference is not a valid M53 repository parameter.
- Docker Distribution's grammar is intentionally stricter than ACR's documented character set. ACR allows periods in namespaces, so a value such as `team.example/api` is ambiguous; M54 rejects any dotted first component and the special `localhost` host prefix before `/` as a conservative guard against full registry references. ACR-specific policy, name existence, and subscription/provider acceptance still require a later approved deployment preflight.
- Preflight is only protective if a future deployment procedure invokes it on the exact parameter file passed to deployment. The README must make this sequencing explicit.
- The repository's Azure account, budget, region/data-location, quota, RPO/RTO, operational owner, private runner entitlement, and M42 approval gates remain unresolved.

## 9. References

Reviewed 2026-10-11:

- [Microsoft: ACR registries, repositories, images, and artifacts](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-concepts)
- [Docker Distribution reference: repository-name grammar](https://github.com/distribution/reference/blob/main/regexp.go)
- [Docker Distribution reference: 255-character repository-name limit](https://github.com/distribution/reference/blob/main/reference.go)
