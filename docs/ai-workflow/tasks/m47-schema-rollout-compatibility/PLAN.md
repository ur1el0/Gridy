# M47 — Safe Schema Rollout Compatibility Plan

## 1. Plan Overview

- **Associated brief:** `TASK_BRIEF.md`
- **Target branch:** `docs/m47-schema-rollout-compatibility`
- **Complexity:** Low / Medium
- **Delivery boundary:** ADR and deployment documentation only; no application, database, CI, or cloud changes.

## 2. Milestone Breakdown

### Milestone 1 — Record schema rollout and verification contract

**Objective:** State how future schema changes must remain compatible with overlapping application revisions and how rollback is handled.

**Files to inspect or modify:**

- `architecture/decisions/013-pilot-notification-and-throttle-guardrails.md` (read-only)
- `architecture/decisions/014-safe-schema-rollout-compatibility.md` (new)
- `architecture/11-deployment-and-ci-cd.md`
- M42 audit plus M43/M44 status records (read-only)

**Actions:**

1. Record an expand/backfill/switch/contract sequence and defer destructive schema changes until old revisions and the agreed rollback window are retired.
2. Require each schema-change task to identify supported old/new application versions, exercise migration from the prior schema on disposable PostgreSQL, and run both relevant application versions against the expanded schema where overlap is possible.
3. State that M43/M44 prove serialized migration ordering and failure blocking, but do not prove compatibility of an older application revision with a newer schema.
4. Distinguish a compatible code redeploy from schema rollback; require forward repair or a separately approved restore when the old code cannot use the current schema.
5. Keep DNS failover/reconnect as an unverified pilot rehearsal; do not overstate M43's no-`hostaddr` settings test.
6. Cross-link ADR 014 from the deployment guide and preserve all M42 business and cloud go/no-go gates.

**Validation commands:**

```bash
git diff --check
rg -n 'expand|backfill|contract|old/new|previous application|DNS|failover|reconnect|compatib|rollback' architecture/decisions/014-safe-schema-rollout-compatibility.md architecture/11-deployment-and-ci-cd.md
git diff --name-only
git diff --cached --name-only
```

Also run a relative-link check for ADR 013/014, a Markdown trailing-whitespace scan for the task packet and changed docs, and confirm no runtime/schema/dependency/CI/container/cloud paths are changed.

**Expected outcome:** Documentation states a safe per-migration compatibility policy and labels the absent live/release-specific evidence as unverified. No application tests are needed because application code is unchanged.

## 3. Completion Checklist

- [x] ADR records phased schema evolution, per-release tests, alternatives, consequences, and rollback limits.
- [x] Deployment guide distinguishes migration gate from old/new code compatibility.
- [x] DNS failover/reconnect remains accurately marked as unverified.
- [x] `git diff --check`, link validation, and Markdown whitespace scan pass.
- [x] No runtime, schema, dependency, CI, container, cloud, or production changes occur.
- [x] Commit and open stacked PR #178 against M46 PR #177; do not merge or deploy.
- [ ] Check hosted CI and Preview after publication; record actual results.

## 4. Risks and Rollback

- Documentation can be reverted without application or database rollback.
- The main risk is presenting a policy as evidence that a specific release is safe. The status log must preserve the specific unverified gates.
