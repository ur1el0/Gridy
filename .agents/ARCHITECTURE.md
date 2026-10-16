# KapitBayan System Architecture

This file is a short agent-facing pointer. The canonical architecture is maintained under [`architecture/`](../architecture/), with navigation from [`docs/README.md`](../docs/README.md).

## Runtime components

- React and TypeScript web client (`frontend/`).
- Flutter mobile client (`mobile/`).
- Django REST API (`backend/`) with internal apps named `gridy_auth`, `gridy_services`, `gridy_reports`, `gridy_communications`, and `gridy_audit`.
- PostgreSQL for hosted relational data and configured local/test databases.
- Configurable private object storage, SMTP, and Firebase Messaging integrations.

## Current design constraints

- Backend permissions and tenant-scoped querysets are authoritative; client route guards are not authorization.
- Queue state is refreshed through HTTP endpoints. Do not describe active workflows as WebSocket-based.
- Selected email and push work runs in process and is best-effort, not a durable queue.
- Scoped DRF API throttles use the PostgreSQL `APIRateLimitWindow` table and share counters across workers. The additive migration must be applied before deploying the new throttle code; these limits are not volumetric DDoS protection. See ADR 016.
- Private identity, billing, and payment evidence is served through authenticated views; never expose public storage URLs.
- Manual payment and Official Receipt workflows remain staff-controlled. The Public Information Navigator is separately feature-gated and defaults off.

Read the relevant ADRs before changing a boundary. Do not rename the internal `gridy_*` app labels or migration history as part of a product rebrand.
