# ADR 016: Shared Database API Throttling

- **Date:** 2026-10-16
- **Status:** Accepted for application-level abuse controls; production rollout requires the additive migration
- **Deciders:** Codex exercising the project owner's delegated technical decision authority. No LGU or data-owner acceptance is recorded here.

## Context

The current Django REST Framework scoped throttles store counters in per-process `LocMemCache`. This allows the effective request budget to multiply across Gunicorn workers and replicas. The system uses Neon PostgreSQL already and the project intentionally avoids adding Redis, Celery, or paid infrastructure.

ADR 013 accepted per-process throttles as an initial non-production pilot choice. That storage decision is superseded for API throttling only by this ADR. ADR 013's in-process notification delivery decision remains unchanged.

## Decision

Use a PostgreSQL table to store rolling request timestamps for every configured scoped API throttle, including authentication, password recovery, and barangay applications. Each row is keyed by a SHA-256 HMAC of the throttle scope and client identity, using the Django secret key; raw IP addresses and user identifiers are not stored. A transaction and row lock serialize requests for the same bucket across workers. Expired rows are pruned in bounded batches.

For unauthenticated clients behind Render, use the first valid IP address in `X-Forwarded-For`, which Render documents as the client address. Fall back to the socket address if that value is absent or malformed. Reassess this parsing if the service moves behind a different proxy topology.

Keep Django's in-memory cache for unrelated general-purpose caching. These application limits mitigate repeated targeted requests; they do not replace edge filtering or provide a volumetric DDoS defense.

## Consequences

### Positive

- A configured scoped budget is shared across application processes and replicas.
- No external service or paid plan is added.
- Stored throttle identifiers are pseudonymized and expire.
- Existing per-scope request rates and DRF `429` responses remain in use.

### Negative

- Each allowed request to a scoped endpoint performs a database write; Neon query volume and latency should be monitored after rollout.
- The additive migration must be applied before serving this backend revision. Old code can continue to run with the new table present, but the new code cannot run before that table exists.
- SQLite does not provide the row-lock behavior needed to prove concurrent enforcement; the concurrency test must run on PostgreSQL before production rollout.

## Alternatives Considered

### Keep per-process `LocMemCache`

- **Why not:** It does not enforce a stable budget across workers or replicas.

### Add Redis or another shared cache service

- **Why not:** It adds infrastructure and cost when the existing PostgreSQL database can support the current low-volume scoped counters.

### Use only edge rate limiting

- **Why not:** The current deployment has no configured edge rule for these application scopes. Edge controls can be added separately if the threat model or traffic volume requires them.

## Rollout and Safety

The migration is additive and creates only a new table. Run it through the normal serialized deployment migration step after reviewing the production migration state. This ADR does not authorize a production database change or deployment.

The change is reversible by rolling back the application first and then dropping only the rate-limit table in a separately approved schema rollback. Existing user and service data is not rewritten.

## References

- [ADR 009: Simplification to Defended Proposal Architecture](009-simplification-to-defended-proposal-architecture.md)
- [ADR 013: Pilot Notification and Throttle Guardrails](013-pilot-notification-and-throttle-guardrails.md)
- [ADR 014: Safe Schema Rollouts Across Application Revisions](014-safe-schema-rollout-compatibility.md)
