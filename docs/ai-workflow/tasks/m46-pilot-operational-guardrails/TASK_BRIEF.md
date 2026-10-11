# M46 — Pilot Operational Guardrails

## 1. Metadata

- **Task ID:** `m46-pilot-operational-guardrails`
- **Task type:** Architecture decision / deployment documentation
- **Target components:** Architecture decisions and deployment documentation
- **Lead, implementer, and reviewer:** Codex (user-directed sole-agent mode)
- **Branch:** `docs/m46-pilot-operational-guardrails`
- **Base:** M45 local checkpoint `019c336439d244ab479c76ded5bf6b7f4145458e`, tree `b8739eb548888138383586811c7790a700658686`; matching M45 remote tree at PR #176 head `ff1492a1770c1c6d59172fbc84c8248c93206703`

## 2. Objective and Scope

Record explicit operating limits for notification delivery and request throttling before a future Azure pilot, retaining the existing low-dependency implementation while preventing the documentation from implying durable delivery or globally consistent abuse protection.

### In scope

- Add an architecture decision record that affirms daemon-thread notifications remain best-effort for the initial non-production pilot, subject to an explicit owner decision before any use requiring guaranteed delivery.
- Record that DRF scoped throttle counts use per-process `LocMemCache`, are approximate request budgets, and are not a brute-force or denial-of-service security boundary.
- Define the operational gates for durable notification requirements and shared rate enforcement before claiming those guarantees or scaling out.
- Align `architecture/11-deployment-and-ci-cd.md` and `docs/walkthrough/deployment_observability.md` with the decision.

### Non-goals

- Do not change application runtime behavior, throttle rates, Gunicorn worker counts, cache configuration, or notification call sites.
- Do not add Celery, Redis, a database outbox, Azure Queue Storage, or any other dependency or worker.
- Do not configure Azure, alter replica counts, provision cloud resources, create secrets, or deploy.
- Do not claim business-owner sign-off on notification loss, security posture, data location, budget, RPO, or RTO.

## 3. Current Behavior and Evidence

- M42 audit `docs/ai-workflow/tasks/m42-azure-migration-readiness/AUDIT.md` records `LocMemCache`-backed DRF throttles as separate per-process counters and daemon-thread notification loss on process stop.
- `backend/config/settings.py` uses `ScopedRateThrottle` and documents these limits as basic request budgets, not a security boundary; the default cache is `LocMemCache`.
- `backend/gridy_auth/tasks.py` starts daemon threads and does not persist or retry in-flight work.
- ADR 009 (`architecture/decisions/009-simplification-to-defended-proposal-architecture.md`) chose daemon threads to preserve the defended low-dependency architecture and accepted their restart-loss trade-off for current workload assumptions.
- Deployment documentation already warns that notification sends can be interrupted; the deployment guide does not yet explain per-process throttling consequences or state pilot gates in one place.

## 4. Rules and Constraints

- ADR 009 remains in force: do not silently reintroduce Celery/Redis.
- Do not represent a successful API response as proof that SMTP or FCM delivered a message.
- Do not represent DRF throttles as security controls or as globally shared across workers/replicas.
- Keep the Azure recommendation as a candidate design; no live Azure configuration is verified or changed.
- Preserve the no-go gates for named budget owner, data-location decision, and agreed RPO/RTO in the M42 audit.

## 5. Observable Acceptance Criteria

1. [ ] A numbered ADR in `architecture/decisions/` records the current best-effort notification and per-process throttle decisions, their alternatives, consequences, and conditions requiring a new design.
2. [ ] The ADR distinguishes an initial non-production pilot constraint from production or business-owner acceptance; it does not claim an external owner has approved message loss or the current abuse-protection posture.
3. [ ] Deployment docs explain that daemon-thread notifications may be lost on process termination and are not retried, and that `LocMemCache` throttle counters are per process, including multiple Gunicorn workers on one replica.
4. [ ] Deployment docs state that durable delivery needs a separately reviewed design and that shared rate enforcement must be evaluated before relying on limits as abuse protection or scaling out.
5. [ ] No runtime, dependency, migration, container, cloud, or production configuration is changed.
6. [ ] Actual documentation checks and git hygiene results are recorded in `STATUS.md`.

## 6. Relevant Files

- `architecture/decisions/009-simplification-to-defended-proposal-architecture.md`
- `architecture/decisions/013-pilot-notification-and-throttle-guardrails.md` (new)
- `architecture/11-deployment-and-ci-cd.md`
- `docs/walkthrough/deployment_observability.md`
- `backend/config/settings.py` and `backend/gridy_auth/tasks.py` (read-only evidence)
- `docs/ai-workflow/tasks/m42-azure-migration-readiness/AUDIT.md` (read-only source)

## 7. Risks and Mitigations

- **Risk:** A pilot decision is mistaken for production or LGU acceptance. **Mitigation:** state the pilot boundary and preserve explicit business-owner and Azure go/no-go gates.
- **Risk:** A later developer assumes in-process limits are shared. **Mitigation:** document the per-worker behavior and the need for shared enforcement before treating the limits as security controls.
- **Risk:** A durable worker is introduced without aligning with ADR 009. **Mitigation:** require a separate design and ADR before adding queue infrastructure or changing the delivery guarantee.
