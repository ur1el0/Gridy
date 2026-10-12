# Plan: M42 — Azure Migration Readiness Assessment

## Plan Overview

- **Associated brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Task type:** Read-only architecture and deployment audit
- **Target branch:** `audit/m42-azure-migration-readiness`
- **Base:** M41 branch head `bf6a649c7970651a6cb837e964f5874bf882e3fb`
- **Complexity:** Medium
- **Implementation boundary:** Documentation only. Do not edit application, build, CI, deployment, or cloud-resource files.

## Milestones

### M1 — Baseline and topology inventory

1. Confirm branch/worktree state and the exact M41 base.
2. Read the repository's deployment, security, tenancy, testing, and ADR documentation.
3. Inspect Docker/CI configuration and locate actual integrations for database, media, push notifications, email, health checks, cookies, and background work.
4. Record line-anchored repository evidence and distinguish intended configuration from verified cloud runtime behavior.

**Validation:** `git status --short --branch`, `git diff --check`, targeted `rg`/file inspections, and a changed-path audit. No application test suite is required because source is not changed.

### M2 — Azure service and constraint assessment

1. Use current Microsoft documentation to compare hosting patterns for the existing containerized frontend and Django API.
2. Evaluate how each candidate preserves `/api/v1` same-origin routing and refresh-cookie semantics.
3. Evaluate managed PostgreSQL networking, backups, availability, and region/service availability; do not select a region without data-residency and latency decisions.
4. Assess secrets/identity, image registry, logs/metrics, external integrations, background-task lifecycle, DNS/TLS, and CI authentication.
5. List trade-offs and unknowns; do not introduce a service or infrastructure pattern as a decision without evidence.

**Validation:** Open official Microsoft Learn pages for claims about Azure services, region availability, identity, CI, and cost estimation. Record source URLs and access date in `AUDIT.md`.

### M3 — Recommendation and migration gates

1. Produce `AUDIT.md` with current topology, a service mapping, confirmed blockers, trade-offs, recommendation, and confidence.
2. Define migration phases: subscription/governance and region decision; non-production landing zone; container/API/web parity; database rehearsal; integration/secret validation; performance/security checks; staged cutover; rollback and decommissioning.
3. Define measurable gates and inputs needed before cost estimate or production migration.
4. Update `STATUS.md` with actual commands, sources consulted, findings, and follow-up recommendations.
5. Self-review against every acceptance criterion; commit only the M42 task packet to this branch.

**Validation:** `git diff --check`; `git status --short`; `git diff --stat` and complete scoped diff; verify no changed paths outside the M42 task packet and no staged unrelated content.

## Risks and Rollback

- This audit does not modify application or production infrastructure; rollback is deleting/reverting the M42 documentation commit.
- A region or monthly cost conclusion would be unreliable without current service availability, workload sizing, retention, redundancy, and negotiated pricing. Record those as open gates.
- Do not apply a migration or provision Azure resources as a consequence of this audit.

## Plan Amendments

- None at baseline. If inspected source contradicts the deployment documents, record the discrepancy in `STATUS.md` and report it; do not silently update production assumptions.
