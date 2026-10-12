# M47 — Safe Schema Rollout Compatibility Contract

## 1. Metadata

- **Task ID:** `m47-schema-rollout-compatibility`
- **Task type:** Architecture decision / deployment documentation
- **Target components:** Architecture and deployment documentation
- **Lead, implementer, reviewer:** Codex (user-directed sole-agent mode)
- **Branch:** `docs/m47-schema-rollout-compatibility`
- **Base:** M46 local checkpoint `0e990595cfc016bcd2828e94faae99f61f1c4c2b`, tree `1339cfbac4b449bd748ec1e02384106a35eb1a08`; equivalent M46 remote PR #177 head has the same tree.

## 2. Objective and Scope

Define a conservative, testable schema evolution and rollback contract for rolling deployments, and accurately record the remaining M42 release-readiness evidence gaps.

### In scope

- Add a numbered ADR specifying an expand/backfill/switch/contract rollout sequence for schema changes while old and new application revisions may overlap.
- Explain the limits of M43's serialized migration job and M44's migration-gate smoke test: they prove migration ordering and failure blocking, not old/new application compatibility.
- Preserve the M42 gate for a PostgreSQL DNS failover/reconnect rehearsal; removal of `hostaddr` pinning is not itself proof of live failover behavior.
- Link the decision from deployment documentation.

### Non-goals

- Do not modify models, migration files, application code, CI workflows, dependencies, Compose, container settings, or cloud resources.
- Do not run migrations against persistent or deployed databases.
- Do not claim compatibility for a migration that has not been exercised against both application versions.
- Do not configure Azure or claim owner approval, region selection, budget, RPO/RTO, or production readiness.

## 3. Current Behavior and Evidence

- M42 Phase 1's gate explicitly asks for local/CI proof of old/new schema compatibility and database reconnection after DNS change.
- M43 moves schema migration out of API startup and removes settings-time hostname resolution/`hostaddr` pinning; it retains `CONN_MAX_AGE=60` and connection health checks.
- M44 runs disposable Compose success/failure migration-gate checks in hosted CI.
- M42's migration and rollback guidance warns that existing migrations can be irreversible and recommends forward-compatible deployment practices.
- The current repository has no release-specific old/new application compatibility rehearsal or live database DNS failover test. No Azure or production environment has been inspected for this milestone.

## 4. Required Rules

- Follow ADR 009 and the existing M43 serialized migration contract; no broker or unrelated deployment architecture is introduced.
- Treat the schema migration job as a gate, not as proof that an old running revision can use the migrated schema.
- Use disposable PostgreSQL for migration compatibility tests; do not access production or persistent user data.
- Treat code rollback and schema rollback separately. Never reverse a data/schema migration as an assumed rollback path.
- Keep live DNS failover verification and business/region/RPO/RTO decisions as explicit external pilot gates.

## 5. Observable Acceptance Criteria

1. [ ] A numbered ADR defines expand, backfill, switch, and contract phases and when a destructive schema operation may ship.
2. [ ] The ADR requires each schema change to identify the supported old/new application versions and to test migration from the previous schema on PostgreSQL.
3. [ ] Rollback guidance distinguishes redeploying prior code on a compatible schema from forward repair or an explicitly approved/restored backup; it does not imply reverse migrations are generally safe.
4. [ ] Deployment docs accurately distinguish migration-order/failure-gate proof from old/new application compatibility proof.
5. [ ] Deployment docs state that M43's removal of `hostaddr` pinning does not prove DNS failover/reconnection; this remains a disposable-environment pilot gate.
6. [ ] No runtime, schema, dependency, CI, container, cloud, or production state changes are made.
7. [ ] Actual documentation checks, changed paths, and remaining verification gaps are recorded in `STATUS.md`.

## 6. Relevant Files

- `architecture/decisions/013-pilot-notification-and-throttle-guardrails.md` (read-only)
- `architecture/decisions/014-safe-schema-rollout-compatibility.md` (new)
- `architecture/11-deployment-and-ci-cd.md`
- `docs/ai-workflow/tasks/m42-azure-migration-readiness/AUDIT.md` (read-only source)
- `docs/ai-workflow/tasks/m43-release-migration-dns-safety/STATUS.md` (read-only evidence)
- `docs/ai-workflow/tasks/m44-compose-migration-gate-ci/STATUS.md` (read-only evidence)

## 7. Risks and Mitigations

- **Risk:** The policy could be mistaken for a passing compatibility test. **Mitigation:** state that it defines future per-migration requirements and that the actual gate remains unverified until exercised.
- **Risk:** Developers could reverse an irreversible migration during rollback. **Mitigation:** distinguish application rollback from schema recovery and require a forward fix or separately approved restore plan.
- **Risk:** A settings-level test could be misrepresented as database failover evidence. **Mitigation:** explicitly retain a disposable PostgreSQL DNS failover rehearsal as a separate gate.
