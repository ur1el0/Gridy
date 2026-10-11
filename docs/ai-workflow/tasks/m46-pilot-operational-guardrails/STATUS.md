# Status — M46 Pilot Operational Guardrails

## 1. Executive Summary

- **Task ID:** `m46-pilot-operational-guardrails`
- **State:** Implementation and local verification complete; publication pending
- **Current milestone:** M1 — record and publish the pilot guardrails
- **Branch:** `docs/m46-pilot-operational-guardrails`
- **Worktree:** `/tmp/gridy-m46-pilot-operational-guardrails`
- **Base:** M45 local checkpoint `019c336439d244ab479c76ded5bf6b7f4145458e`, tree `b8739eb548888138383586811c7790a700658686`; remote equivalent `ff1492a1770c1c6d59172fbc84c8248c93206703`
- **Implementer:** Codex (user-directed sole-agent mode)

## 2. Progress

| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Record and publish the pilot guardrails | Complete locally | ADR and deployment documentation align on best-effort delivery, per-process throttles, and outstanding owner/scale gates. |

## 3. Baseline and Decisions

- M42's Phase 1 items 3 and 4 call for explicit notification-delivery and rate-limit behavior decisions before scale-out.
- ADR 009 already accepts restart-loss risk for the current capstone-scale workload and prohibits silently restoring Celery/Redis.
- The M42 audit records the default throttle cache as `LocMemCache` and notes that Gunicorn has multiple workers, so one replica does not create shared counters.
- M46 will keep the current app implementation. It will document best-effort notifications and approximate request budgets as constraints, not guarantees.
- External owner acceptance, Azure budget/region/data-location decisions, and RPO/RTO remain outside this technical decision and remain go/no-go gates.
- Hindsight search/list/capture were attempted in this session but the local service refused connections at `127.0.0.1:9077`; no memory content informed this decision.

## 4. Files Changed or Created

- `architecture/decisions/013-pilot-notification-and-throttle-guardrails.md`
- `architecture/11-deployment-and-ci-cd.md`
- `docs/walkthrough/deployment_observability.md`
- `docs/ai-workflow/tasks/m46-pilot-operational-guardrails/{TASK_BRIEF.md,PLAN.md,STATUS.md}`

The task packet is ignored by the broad `docs/ai-workflow` rule and must be force-added to the milestone commit.

## 5. Verification Log

| Check | Command | Result |
| --- | --- | --- |
| Isolated worktree baseline | `git status --short --branch` at M46 branch creation | New branch `docs/m46-pilot-operational-guardrails` was clean at creation and based on the M45 local checkpoint; current scoped changes are listed below. |
| Source and decision review | Read M42 `AUDIT.md`, ADR 009, `backend/config/settings.py`, `backend/gridy_auth/tasks.py`, and deployment docs | Confirmed daemon-thread notification behavior, local process cache, three default Gunicorn workers per M42 audit, and existing warnings about restart loss. |
| Hindsight | Search/list/capture via Hindsight | Unavailable: `ECONNREFUSED 127.0.0.1:9077`; no page content returned. |
| Scoped document scan | `rg -n 'best-effort|daemon thread|LocMemCache|per-process|rate limit|throttl|scale out|durable' architecture/decisions/009-simplification-to-defended-proposal-architecture.md architecture/decisions/013-pilot-notification-and-throttle-guardrails.md architecture/11-deployment-and-ci-cd.md docs/walkthrough/deployment_observability.md` | PASS: ADR 013 and deployment docs contain the decision, process-local scope, durability limits, and scale-out gates; ADR 009 remains the referenced low-dependency decision. |
| Relative ADR links | Python `Path.is_file()` check for ADR 009 and ADR 013 targets referenced from deployment docs | PASS: all 3 relative links resolve, including the walkthrough link to ADR 013. |
| Diff hygiene | `git diff --check` and `git diff --cached --check` | PASS: clean; no whitespace errors. |
| Markdown whitespace | Python scan of ADR 013, both deployment documents, and all 3 task-packet Markdown files | PASS: no trailing spaces or tabs in 6 Markdown files. |
| Diff scope | `git diff --name-only` and `git status --short --branch` | Only the two deployment documents are tracked modifications; ADR 013 is the sole new architecture document. The task packet is under the ignored `docs/ai-workflow` tree and will be explicitly force-added. |
| Staged state | `git diff --cached --name-only` | Empty; no files staged. |
| Runtime/schema/dependency boundary | `git status --short --branch`, `git diff --name-only`, and read-only check of changed paths | No application source, migrations, dependency files, Docker/Compose, CI, environment, or cloud configuration changes. No tests were run because the milestone changes documentation only. |

## 6. Review Notes

- ADR 013 is a technical default for a non-production pilot. It explicitly does not record LGU/data-owner approval or production acceptance.
- The existing daemon-thread model remains best-effort; the ADR does not claim retries or durable work.
- The existing `LocMemCache` throttle counters remain approximate per-process budgets; a single replica still has separate counters in its three Gunicorn workers.
- No application behavior, schema, dependency, cloud, or deployment state changed.

## 7. Remaining Work

- [x] Write ADR 013 with alternatives, consequences, and bounded pilot scope.
- [x] Align architecture and observability documentation.
- [x] Run documentation consistency and diff-hygiene checks.
- [x] Review scope and preserve zero runtime, cloud, schema, and dependency changes.
- [ ] Commit the scoped documents and task packet.
- [ ] Publish the milestone branch and open a stacked PR against M45 PR #176; do not merge or deploy.
