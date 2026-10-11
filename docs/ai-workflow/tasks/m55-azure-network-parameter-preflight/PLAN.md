# Plan — M55 Azure Pilot Network Parameter Preflight

## 1. Plan Overview

- **Associated brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target branch:** `infra/m55-azure-network-parameter-preflight`
- **PR base:** `infra/m54-acr-repository-preflight`
- **Worktree:** `/tmp/gridy-m55-azure-network-parameter-preflight`
- **Base:** M54 status checkpoint `9fec41114b8348be0803d617bb478a5271fc7163`, tree `0d8eb69566dac4bfe77e5acbdfd433c6765c299b`
- **Complexity:** Medium
- **Boundary:** Offline validation, tests, CI invocation, README, and M55 task packet only.

## 2. Milestones

### M1 — Confirm baseline and network contract

1. Verify the M55 worktree is clean and based on M54's final local checkpoint.
2. Inspect the four network parameters in `main.bicep` and M54's JSON/value-redaction behavior.
3. Verify current Microsoft primary sources for ACA workload-profile subnet sizing/reserved ranges and PostgreSQL delegated subnet sizing.
4. Confirm the checker will not choose actual CIDRs, infer connected networks, query Azure, or close M42 gates.

**Validation:** Git/worktree state, Bicep parameter source review, official documentation, and task-packet review.

### M2 — Implement the offline network validator test-first

1. Add stdlib unit tests with temporary ARM JSON parameter files for valid input, malformed/duplicate JSON, missing/wrong-shaped values, invalid IPv4/CIDR syntax, host bits, subnet containment, pairwise overlap, minimum sizes, reserved-range overlap, and redaction.
2. Run the new test module once to record the expected import failure.
3. Add `check_azure_pilot_parameters.py`; use M54's repository validation and fail closed without echoing any values.
4. Implement only checks documented in TASK_BRIEF.md; do not infer external network ranges or provider behavior.

**Validation:** `python3 -m unittest discover -s scripts/ci -p 'test_azure_pilot_parameters.py' -v` before and after implementation.

### M3 — Add CI and operator documentation

1. Add a separate Python 3.12 job for the new stdlib tests; do not add credentials, Azure login, or deployment steps.
2. Leave the Bicep compile/contract job unchanged.
3. Document the combined M54 repository and M55 network preflight command, exact prefix parameters checked, current source-based constraints, and limits.

**Validation:** Focused unittest suite, Python byte-compilation, workflow YAML parsing, scoped whitespace scan, and `git diff --check`.

### M4 — Review and deliver

1. Review the complete diff against every acceptance criterion and verify no committed parameter file or protected path is included.
2. Commit only the two scripts, CI workflow, README, and M55 task packet.
3. Publish the same content tree as a child of the current remote M54 branch and open a stacked PR targeting M54; leave it open/unmerged.
4. Inspect all hosted checks and the Vercel preview; record exact outcomes in STATUS.md.
5. Preserve M42 gates and perform no Azure operation.

**Validation:** Local tests/syntax/hygiene, local/remote tree equality, hosted CI and preview, final PR state, and primary-checkout status.

## 3. Risks and Mitigations

- **Docs drift:** Pin the Microsoft references and review date in task docs; recheck before any deployment.
- **False external-overlap assurance:** The checker sees only the supplied VNet/subnet values. Explicitly leave VPN/peered/on-premises overlap to the network owner.
- **Address capacity:** Minimum `/27` and `/28` checks do not prove workload capacity or HA headroom. Do not imply that they select a suitable size.
- **Secret exposure:** Do not print parameter values or contents; tests must prove redaction.
- **Cloud-governance bypass:** Keep this an offline local check and CI unit tests only; no cloud credentials or deployment path.
- **Stacked branch:** M55 depends on M54 and should target its remote PR branch to keep the diff narrow.

## 4. Plan Amendments

- None at baseline. If implementation or CI evidence conflicts with the documented CIDR contract, record the exact evidence and make the narrowest correction before proceeding.
