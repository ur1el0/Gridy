# ADR 013: Pilot Notification and Throttle Guardrails

- **Date:** 2026-10-11
- **Status:** Accepted for the initial pilot. The notification decision remains current; the throttle-storage decision is superseded by ADR 016.
- **Deciders:** Codex exercising the project owner's delegated technical decision authority. No LGU or data-owner acceptance is recorded here.

## Context

ADR 009 selected in-process daemon threads to avoid adding Celery and Redis to the defended capstone architecture. M42's Azure readiness audit also found that DRF scoped throttles use Django's per-process `LocMemCache`; the backend currently starts three Gunicorn workers. A future platform restart can interrupt in-flight notifications. At the time, throttle counters were not shared between workers or replicas. ADR 016 later replaced only the throttle-storage choice with a PostgreSQL-backed implementation; the notification decision remains unchanged.

## Decision

Keep the existing daemon-thread notification implementation for the initial non-production pilot and treat email and push delivery as best-effort. The original `LocMemCache` throttle choice was superseded by ADR 016; current scoped API throttle windows use PostgreSQL. Neither ADR approves message loss or a security posture on behalf of an LGU or data owner for production.

Before a deployment relies on durable notification delivery, design and review a persistent queue/outbox and worker with retry and idempotency behavior. The database-backed throttle implementation in ADR 016 still does not provide volumetric DDoS protection; any edge protection requires a separate deployment decision. Any change to ADR 009 or addition of a broker/worker requires a separate decision; Celery and Redis are not reintroduced by this ADR.

## Alternatives Considered

### Add a durable notification queue now

- **Pros:** Work can survive process restarts and can support retries and delivery tracking.
- **Cons:** Requires a durable work model, worker lifecycle, retry/idempotency policy, monitoring, and additional operational cost.
- **Why not:** Notification delivery requirements, workload, and Azure operational ownership have not been established; this would reverse ADR 009 without sufficient evidence.

### Use Celery and Redis for notification delivery and shared throttling

- **Pros:** Provides familiar task-queue and shared-cache patterns.
- **Cons:** Reintroduces services expressly removed by ADR 009 and increases deployment and support burden.
- **Why not:** It conflicts with the defended low-dependency topology. A future durable design must compare alternatives against actual requirements rather than assume Celery/Redis.

### Add a shared throttle backend or edge limiter (historical alternative)

- **Pros:** Counters or request budgets can be consistently enforced across application workers and replicas.
- **Cons:** Requires selecting, configuring, securing, monitoring, and paying for a shared service or gateway policy.
- **Why not:** At the time this ADR was accepted, no target Azure gateway or workload had been selected, so shared throttle storage was deferred. ADR 016 later accepted a PostgreSQL-backed implementation after the risk of per-process counters was reviewed. Edge enforcement remains a separate choice.

### Keep the current behavior without documenting its limits

- **Pros:** No documentation work.
- **Cons:** Operators could interpret an HTTP success or configured throttle rate as a delivery or security guarantee.
- **Why not:** That would misstate observable runtime behavior and obscure scale-out prerequisites.

## Consequences

### Positive

- The current low-dependency runtime remains aligned with ADR 009.
- Pilot planning has explicit boundaries for notification delivery and rate enforcement.
- The project does not add a separate queue or cache service; the existing PostgreSQL database supports scoped request windows. Edge gateway enforcement remains a separate decision tied to measured workload and operational ownership.

### Negative

- An application process stop may lose an in-flight email or push notification; the application does not persist or retry the work.
- PostgreSQL-backed scoped throttle windows add database writes and require concurrency verification against PostgreSQL.
- Production delivery requirements and abuse-protection requirements remain open owner decisions.

### Risks

- **Risk:** The pilot is treated as proof of production delivery guarantees. **Mitigation:** retain the non-production scope and require owner review before production commitments.
- **Risk:** Scoped application throttles are treated as volumetric DDoS protection. **Mitigation:** ADR 016 and deployment docs describe their targeted abuse-control scope and require separate edge evaluation for volumetric threats.
- **Risk:** A future queue change silently contradicts ADR 009. **Mitigation:** require a separately reviewed ADR and operational plan before adding workers or brokers.
