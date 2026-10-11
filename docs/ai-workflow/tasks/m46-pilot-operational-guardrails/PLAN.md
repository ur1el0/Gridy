# M46 — Pilot Operational Guardrails Plan

## 1. Plan Overview

- **Associated brief:** `TASK_BRIEF.md`
- **Target branch:** `docs/m46-pilot-operational-guardrails`
- **Complexity:** Low / Medium
- **Delivery boundary:** Documentation and ADR only; no application or cloud configuration changes.

## 2. Milestone Breakdown

### Milestone 1 — Record and publish the pilot guardrails

**Objective:** Make the accepted low-dependency behavior and its limits explicit for future pilot planning.

**Files to inspect or modify:**

- `architecture/decisions/009-simplification-to-defended-proposal-architecture.md` (read-only)
- `architecture/decisions/013-pilot-notification-and-throttle-guardrails.md` (new)
- `architecture/11-deployment-and-ci-cd.md`
- `docs/walkthrough/deployment_observability.md`
- `backend/config/settings.py` and `backend/gridy_auth/tasks.py` (read-only implementation evidence)

**Actions:**

1. Record the decision to keep daemon-thread notification delivery best-effort for the initial non-production pilot, without claiming a durable delivery guarantee or external owner approval.
2. Record that DRF scoped throttles use per-process `LocMemCache`, including per Gunicorn worker, and are approximate budgets rather than security boundaries.
3. State that a required delivery guarantee needs a separate durable queue/outbox design and a new decision consistent with ADR 009; no broker is selected here.
4. State that shared rate enforcement must be evaluated before the system relies on throttling for abuse protection or increases replicas.
5. Cross-link the decisions from deployment docs while preserving the M42 Azure budget, region/data location, RPO/RTO, and operational-owner gates.
6. Confirm that the diff changes no source code, runtime configuration, dependencies, schema, containers, cloud resources, or production state.

**Validation commands:**

```bash
git diff --check
rg -n 'best-effort|daemon thread|LocMemCache|per-process|rate limit|throttl|scale out|durable' architecture/decisions/009-simplification-to-defended-proposal-architecture.md architecture/decisions/013-pilot-notification-and-throttle-guardrails.md architecture/11-deployment-and-ci-cd.md docs/walkthrough/deployment_observability.md
git diff --name-only
git diff --cached --name-only
```

**Expected outcome:** The ADR and deployment guide state the same operating limits; no tests are needed because application code is unchanged.

## 3. Completion Checklist

- [x] ADR includes context, decision, alternatives, consequences, and risks.
- [x] Production/owner sign-off and Azure readiness gates remain explicitly outstanding.
- [x] Deployment guide explains per-process throttle limits and best-effort notification semantics.
- [x] `git diff --check` passes and only the scoped documentation/task-packet files are changed.
- [x] No staged unrelated files, source changes, migrations, dependencies, container changes, or cloud operations.
- [ ] Commit and open a stacked PR targeting M45 PR #176; do not merge or deploy.

## 4. Risks and Rollback

- Documentation can be revised with a normal documentation commit; there is no application or database rollback.
- The main risk is an overstatement of operational acceptance. The ADR must distinguish a bounded technical recommendation from LGU or business-owner approval.
