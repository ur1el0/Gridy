---
trigger: always_on
---

# Enterprise Architecture Standards

These guidelines apply across the entire Gridy ecosystem to ensure enterprise-grade stability and security.

### 1. Decision & Evidence Pattern (ADRs)

- **Rule**: Document key architectural trade-offs, solutions, and security choices in architecture decision records.
- **Practice**: Maintain an `architecture/decisions/` directory containing structured `.md` files detailing system baselines, JWT strategies, and contract-driven API choices.

### 2. Contract-First API Pipeline (OpenAPI)

- **Rule**: Ensure the backend's OpenAPI contract acts as the single source of truth for all client API endpoints.
- **Practice**: Decorate DRF serializers and views with OpenAPI metadata (`drf-spectacular`). Generate schema definitions dynamically to ensure no contract drift between the Django backend and React/Flutter clients.

### 3. Session Security & Boundary Handling (RefreshSession)

- **Rule**: Do not store refresh tokens in raw response payloads; they must reside inside server-backed rotating cookie sessions.
- **Practice**: Track and validate `user_agent`, `ip_address`, `expires_at`, and revocation status for all sessions. Implement token rotation on every token refresh request to prevent token replay attacks.

### 4. System Health & Observability (Health Monitoring)

- **Rule**: The system must expose structured monitoring and heartbeat metrics endpoints.
- **Practice**: Provide a `/api/health/` monitoring route checking database access, Celery broker status, and Redis cache latency. Format application logs to structured JSON streams.

### 5. Environment Variable Safety

- **Rule**: Keep configuration synced across developers.
- **Practice**: Whenever a new environment variable or secret is required in the backend or frontend, immediately append a placeholder for it in `.env.example` to prevent configuration drift.
