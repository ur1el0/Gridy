# ADR 013: Pilot Notification and Throttle Guardrails

- **Date:** 2026-10-11
- **Status:** Accepted as the technical default for a non-production pilot; production requirements still need owner review
- **Deciders:** Codex exercising the project owner's delegated technical decision authority. No LGU or data-owner acceptance is recorded here.

## Context

ADR 009 selected in-process daemon threads to avoid adding Celery and Redis to the defended capstone architecture. M42's Azure readiness audit also found that DRF scoped throttles use Django's per-process `LocMemCache`; the backend currently starts three Gunicorn workers. A future platform restart can interrupt in-flight notifications, and counters are not shared between workers or replicas. The pilot needs to describe these behaviors accurately without implying guarantees or introducing distributed services before requirements and workload evidence exist.

## Decision

Keep the existing daemon-thread and `LocMemCache` implementations for the initial non-production pilot. Treat email and push delivery as best-effort, and treat throttle rates as approximate per-process request budgets rather than brute-force or denial-of-service controls. This decision does not approve message loss or a security posture on behalf of an LGU or data owner for production.

Before a deployment relies on durable notification delivery, design and review a persistent queue/outbox and worker with retry and idempotency behavior. Before relying on shared abuse protection or increasing replicas, evaluate and test an appropriate shared or edge rate-enforcement mechanism. Any change to ADR 009 or addition of a broker/worker requires a separate decision; Celery and Redis are not reintroduced by this ADR.

## Alternatives Considered

### Add a durable notification queue now

- **Pros:** Work can survive process restarts and can support retries and delivery tracking.
- **Cons:** Requires a durable work model, worker lifecycle, retry/idempotency policy, monitoring, and additional operational cost.
- **Why not:** Notification delivery requirements, workload, and Azure operational ownership have not been established; this would reverse ADR 009 without sufficient evidence.

### Use Celery and Redis for notification delivery and shared throttling

- **Pros:** Provides familiar task-queue and shared-cache patterns.
- **Cons:** Reintroduces services expressly removed by ADR 009 and increases deployment and support burden.
- **Why not:** It conflicts with the defended low-dependency topology. A future durable design must compare alternatives against actual requirements rather than assume Celery/Redis.

### Add a shared throttle backend or edge limiter now

- **Pros:** Counters or request budgets can be consistently enforced across application workers and replicas.
- **Cons:** Requires selecting, configuring, securing, monitoring, and paying for a shared service or gateway policy.
- **Why not:** No target Azure gateway, workload, or abuse-protection requirement has been selected. The current limits are already documented as approximate request budgets, so this decision is deferred until a deployment design and threat requirement justify it.

### Keep the current behavior without documenting its limits

- **Pros:** No documentation work.
- **Cons:** Operators could interpret an HTTP success or configured throttle rate as a delivery or security guarantee.
- **Why not:** That would misstate observable runtime behavior and obscure scale-out prerequisites.

## Consequences

### Positive

- The current low-dependency runtime remains aligned with ADR 009.
- Pilot planning has explicit boundaries for notification delivery and rate enforcement.
- The project does not select a queue, cache, or gateway before measuring workload and confirming operational ownership.

### Negative

- An application process stop may lose an in-flight email or push notification; the application does not persist or retry the work.
- Throttle counters are isolated by Gunicorn worker and replica, so observed limits can exceed configured rates under multi-process traffic.
- Production delivery requirements and abuse-protection requirements remain open owner decisions.

### Risks

- **Risk:** The pilot is treated as proof of production delivery guarantees. **Mitigation:** retain the non-production scope and require owner review before production commitments.
- **Risk:** Application throttles are treated as a security boundary. **Mitigation:** deployment docs state their per-process scope and require shared/edge controls when consistent abuse enforcement is needed.
- **Risk:** A future queue change silently contradicts ADR 009. **Mitigation:** require a separately reviewed ADR and operational plan before adding workers or brokers.
