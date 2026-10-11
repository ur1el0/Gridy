# Plan: M54 — ACR Repository Parameter Preflight

## 1. Plan Overview

- **Associated brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target branch:** `infra/m54-acr-repository-preflight`
- **PR base:** `infra/m53-acr-publisher-rbac`
- **Worktree:** `/tmp/gridy-m54-acr-repository-preflight`
- **Base:** M53 task checkpoint, local commit `7d50e11b44d21ca50c4379b5f2cb632b7e6c56b9`
- **Complexity:** Low to medium
- **Boundary:** Offline Python validation, unit tests, CI test invocation, README, and task packet only.

## 2. Milestones

### M1 — Confirm the parameter contract and baseline

1. Verify the isolated M53-derived branch and clean worktree.
2. Confirm M53's exact parameter names, absence of defaults, CI Bicep validation job, and README deployment boundary.
3. Use current primary-source ACR and Docker Distribution references for allowed characters, path structure, and interoperable length limit.
4. Confirm no existing deployment wrapper or concrete parameter file exists; do not invent either.
5. Record M53 PR #184 and the latest successful hosted run as the branch base context.

**Validation:** Git/worktree inspection, targeted source review, GitHub PR/run status, and primary-source documentation.

### M2 — Implement offline parameter preflight

1. Write unit tests first for expected valid/invalid names, parameter-file structures, duplicate keys, CLI results, and value redaction; run them to record the initial expected import failure.
2. Add the standard-library Python command that accepts one ARM JSON deployment parameter file.
3. Parse JSON with duplicate-key rejection; require a top-level `parameters` object and literal string `value` entries for both M53 repository keys.
4. Validate exact repository paths using the Docker-compatible lowercase path-component grammar and 255-character maximum, while excluding registry domains, tags, and digests. When a slash is present, reject a first component containing a dot or equal to `localhost` as a host-like prefix; this conservative rule intentionally excludes some otherwise valid dotted top-level namespaces.
5. Reject equal backend/frontend names.
6. Keep diagnostics value-free and exit non-zero on every malformed or invalid input.

**Validation:** Run the test module before and after implementation using temporary JSON files; no real parameter file or Azure operation.

### M3 — Exercise negative cases in CI and document usage

1. Add stdlib `unittest` coverage for valid names, namespaces, allowed separators, malformed input, duplicate keys, wrong/missing types, invalid syntax/boundaries, equal names, and value redaction.
2. Add a separate standard GitHub-hosted Python 3.12 job for this test module; keep the Azure compile job unchanged and do not add credentials, Azure login, or deployment steps.
3. Update README with a command that validates the exact JSON file before any future `az deployment ... --parameters @...` invocation and explain that the check is syntax-only.

**Validation:** `python3 -m unittest scripts/ci/test_acr_repository_parameters.py`, YAML/source inspection, then hosted CI.

### M4 — Review and deliver

1. Review the complete diff against the acceptance criteria and confirm no concrete parameter values or protected files were included.
2. Run the test module, Python compilation, `git diff --check`, and exact changed-path review.
3. Commit only the two script files, CI workflow, README, and M54 task packet.
4. Publish an equivalent content tree parented on the current remote M53 head; open a stacked PR targeting M53 and leave it open/unmerged.
5. Inspect the complete hosted CI matrix and record exact run/commit/tree details in STATUS.md.
6. Preserve M42 approval gates; do not provision or deploy.

**Validation:** Local test/syntax/diff checks, remote/local tree equality, GitHub Actions and Vercel status, and primary checkout inspection.

## 3. Risks and Mitigations

- **Grammar drift:** Docker/ACR behavior can evolve. Record the source and date, make the accepted subset explicit, and revalidate before a future deployment change.
- **Host/namespace ambiguity:** ACR allows periods in namespaces, so `host.example/path` is ambiguous in a bare repository-name field. Reject any dotted first component and the special `localhost` host prefix before `/`, and document the conservative exclusion; no actual name is selected in M54.
- **CI environment isolation:** Run the standard-library validator tests in a dedicated Python job instead of the Azure CLI container so the check does not depend on the CLI image's Python environment.
- **Input/value leakage:** Parameter files can contain secrets unrelated to repository names. The checker must never dump the file, exception content, or values in error messages.
- **Bypass risk:** An operator can skip a standalone command. Make sequencing explicit in README and require the future deployment wrapper/workflow to call the checker before deployment.
- **Governance confusion:** Passing local syntax checks is not Azure approval or proof of availability. State this in output and docs.
- **Stacked branch:** M54's PR depends on M53 and inherits its pending merge state; target M53 to keep the diff focused.

## 4. Plan Amendments

- **M2 test evidence:** The first validator test accepted `registry.azurecr.io/api` because its tokens also match a valid slash-delimited ACR namespace. Amend the preflight contract to reject any first path component containing a dot, or equal to `localhost`, when followed by `/`. This deliberately rejects some otherwise valid dotted top-level namespaces to prevent an accidental full registry reference from populating an ABAC parameter. The test now covers this case; no Azure operation or repository-value selection is added.
- **M3 CI shape:** Put the stdlib test in a dedicated GitHub-hosted Python 3.12 job instead of the Azure CLI Bicep job. This avoids coupling the test to tools bundled inside the Azure CLI action image and leaves the compile job unchanged.
- If the absence of a deployment wrapper prevents binding the checker into a deployment path, keep M54 as a reusable offline preflight and document that the future deployment task must invoke it; do not add an Azure deployment wrapper here.
