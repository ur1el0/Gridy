# ADR 014: Safe Schema Rollouts Across Application Revisions

- **Date:** 2026-10-11
- **Status:** Accepted as the release-engineering policy; no specific migration compatibility result is implied
- **Deciders:** Codex exercising the project owner's delegated technical decision authority. This does not record LGU or data-owner acceptance.

## Context

M43 moves Django migrations into a serialized pre-release step and removes settings-time PostgreSQL hostname resolution and `hostaddr` pinning. M44's disposable Compose smoke verifies that a successful migration allows the backend to start and a failed migration blocks it. These controls address migration ordering and startup safety, but they do not prove that an older API revision can continue serving requests against a schema after a newer revision migrates it.

M42's Azure readiness gate separately calls for old/new schema compatibility and database reconnection after DNS changes. No release-specific overlap rehearsal or live DNS failover test has been run. Existing migration history also includes data operations that should not be treated as automatically reversible. A safe rolling-release contract must distinguish migration execution from compatibility, and code rollback from schema rollback.

## Decision

For schema changes deployed while application revisions may overlap, use an **expand, backfill, switch, contract** sequence:

1. **Expand:** Add the new table, nullable/defaulted column, or compatible index without removing or changing the meaning of fields used by the currently running application. Apply only schema operations that the previous release can tolerate.
2. **Deploy compatible code:** Deploy code that can read the expanded schema and, where needed, continue to read/write the old representation. Keep old and new revisions compatible with the expanded schema throughout the rollout and rollback window.
3. **Backfill:** Migrate existing data with an idempotent, bounded process. Record progress, failure handling, and validation counts. Do not combine a large backfill with API startup or assume a one-shot migration is operationally safe for arbitrarily large tables.
4. **Switch:** After the backfill is validated, direct reads and writes to the new representation. Remove transitional behavior only in a later release after all old revisions are stopped.
5. **Contract:** Remove an old column/table, tighten a constraint, or change incompatible semantics only after the old application revision is no longer serving, the rollback window has closed, and a separate deployment has confirmed the contract operation is safe.

Every schema-change task must identify the oldest application revision expected to overlap and the rollback target. Its local/CI evidence must use disposable PostgreSQL and, as applicable, prove migration from an empty database, upgrade from the prior release schema, and the supported old and new application behavior against the expanded schema. Review lock duration, table size, backfill runtime, and failure recovery for the affected operation. The M44 migration-gate smoke remains useful but is not a substitute for these release-specific compatibility checks.

Run the M43 one-shot migration job before routing traffic to a new API revision. A prior application version may be redeployed only while the current database schema remains compatible with it. Do not treat reversing migrations as the default rollback: use a forward repair when appropriate, or follow a separately approved and tested backup-restore plan when the data-loss implications are accepted.

Removing `hostaddr` pinning lets new PostgreSQL connections resolve the configured hostname normally, but it does not prove reconnection across a provider DNS failover. Before relying on managed database failover, exercise an active-connection interruption and subsequent reconnect against a disposable PostgreSQL environment or approved non-production provider environment. Verify that the new connection reaches the current hostname target and that application health recovers. This remains an explicit pilot gate until such evidence is recorded.

## Alternatives Considered

### Apply all migrations before new code and assume old revisions are compatible

- **Pros:** Simple release sequence and consistent with the existing one-shot migration job.
- **Cons:** Migration order alone says nothing about whether the old code understands a changed or removed column while it is still running.
- **Why not:** It would make the M43/M44 gate appear stronger than its evidence and can break rolling revisions or rollback.

### Stop all API traffic for every schema migration

- **Pros:** Avoids old/new revision overlap during the migration itself.
- **Cons:** Requires a planned outage and still does not establish a safe application rollback against the resulting schema.
- **Why not:** Downtime is a release decision and cannot be assumed as the universal strategy; compatibility still needs an explicit contract.

### Reverse the database migration whenever code is rolled back

- **Pros:** Can appear to restore the previous code/schema pairing.
- **Cons:** Data migrations may be irreversible or lossy, and reversing schema operations can discard data created after deployment.
- **Why not:** The repository's rollback guidance already treats selected migrations as forward-only; backup restoration has separate data-loss consequences.

## Consequences

### Positive

- Future releases have an explicit compatibility sequence and test expectation before schema changes are deployed.
- M43/M44 migration gating is described at the level its evidence supports.
- Code rollback, forward schema repair, and backup restore are treated as separate recovery choices.

### Negative

- Schema changes that remove fields or tighten constraints may require multiple releases and temporary compatibility code.
- PostgreSQL migration and backfill tests add work to schema-changing milestones.
- Azure or provider DNS failover remains unverified until a representative disposable environment is available.

### Risks

- **Risk:** The policy is mistaken for proof that a specific deployment is safe. **Mitigation:** require a release-specific compatibility matrix and test evidence in each migration task's status log.
- **Risk:** A large backfill holds locks or consumes resources. **Mitigation:** review operation behavior, test realistic data volume outside production, and use an idempotent bounded process when needed.
- **Risk:** Teams restore an old database backup and lose acknowledged writes. **Mitigation:** require explicit restore approval, a backup timestamp, and a recorded data-loss window before restore.
