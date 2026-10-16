# KapitBayan Security Guidance

This is an agent-facing summary, not a replacement for code review. Use [architecture/09-security-and-rbac.md](../architecture/09-security-and-rbac.md), the relevant ADR, backend permissions, serializers, and tests as the detailed contract.

## Core rules

1. Enforce authorization in Django for every list, detail, mutation, and media endpoint. UI hiding and route guards are not security controls.
2. Derive tenant scope from authenticated identity and persisted records. Never trust a client-selected `barangay_id` to authorize cross-tenant access.
3. Apply endpoint-specific role rules. Residents access their own records; barangay staff are limited to their assigned tenant; DILG oversight is limited to explicit DILG workflows. `FIELD_OFFICIAL` capabilities are defined per endpoint and client.
4. Keep identity documents, billing evidence, and payment proofs behind authenticated media views. Do not return public URLs, raw storage paths, or sensitive filenames.
5. Do not log resident PII, authentication secrets, or payment proof contents. `AuditLog` is a durable application record for selected events, not a cryptographically immutable ledger; actor references may be nulled when accounts are erased.
6. Account lifecycle changes must revoke sessions and preserve municipal records according to the current deletion/retention contract.
7. Electronic payment evidence is manually reviewed. A resident-provided reference or screenshot is not proof of settlement. Positive-fee document release requires the server-side O.R. gate.

## Authentication and runtime limits

The refresh-cookie policy defaults to `SameSite=Strict` and is secure in production settings. The browser is intended to use the same-origin proxy; do not loosen cookie policy or CORS based on local symptoms without checking host, origin, CSRF, and proxy headers together. Native mobile clients do not use browser CORS enforcement.

There is no Celery/Redis queue. In-process notification work is best-effort. Scoped API throttle counters are stored in PostgreSQL and shared across workers; the general-purpose `LocMemCache` is still per process. Database-backed throttles are not volumetric DDoS protection.

## Before making a security change

- Read [ADR 004](../architecture/decisions/004-multi-tenant-isolation.md), the relevant auth/session/storage/payment ADRs, and the current deployment notes.
- Add regression coverage for allowed and denied roles, cross-tenant objects, missing objects, and storage/provider failure paths as required by the task.
- Report only checks that were actually run. Verify live cloud behavior independently; configuration prose is not evidence of deployment.
