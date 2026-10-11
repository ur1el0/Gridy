# 11 Deployment & CI/CD Pipeline

## 1. Hosting Infrastructure & Origin Topology

KapitBayan is configured for an intended **Same-Origin Reverse Proxy Architecture** for its production web deployment to guarantee robust cookie security and eliminate third-party cookie restrictions:

*   **Backend & Database:** Deployed on **Render.com**. Render provides a managed PostgreSQL instance and auto-deploys the Django backend from the `main` branch.
    *   **Production API Hostname:** `https://gridy-backend.onrender.com`
*   **Frontend Web Application:** Hosted on **Vercel** as a single-page application (SPA).
    *   **Production Frontend Hostname:** `https://gridy.vercel.app`
*   **Reverse Proxy Contract:**
    *   Vercel Edge Rewrites (`frontend/vercel.json`): Rewrites all `/api/v1/:path*` requests directly to `https://gridy-backend.onrender.com/api/v1/:path*`.
    *   Containerized Stack (`frontend/nginx.conf`): Nginx reverse proxies `/api/` traffic directly to `http://backend:8000`.
    *   Client URL Resolution (`frontend/src/api/axios.ts`): Resolves `VITE_API_BASE_URL` to relative `/api/v1` in production when unset. Any configured environment variable overrides this fallback.

### Release migration gate

Docker Compose runs database migrations in its one-shot `migrate` service after PostgreSQL is healthy; the API service waits for that service to exit successfully. The API entrypoint itself only starts the requested server process.

For deployments outside Compose, configure one serialized pre-release process using the backend image and `python manage.py migrate --noinput`, and block the new API revision until it succeeds. Do not run migrations in the image build or independently in every API replica. This repository documents the release contract; it does not configure or verify a live Render release command or Azure migration job.

Database settings keep the PostgreSQL hostname and omit a startup-resolved `hostaddr`. When `hostaddr` is absent, libpq resolves the hostname for a connection and tries the returned addresses in order until one succeeds; this lets future connections use updated DNS answers while preserving address-family fallback. Existing Django connections still follow the configured connection lifetime and health checks. See the [PostgreSQL 15 libpq connection documentation](https://www.postgresql.org/docs/15/libpq-connect.html).

---

## 2. Security Boundaries & Cookie Policy

Under this configured topology, web browser traffic targets `/api/v1` on the frontend domain, allowing the browser to treat authentication exchanges as **same-origin**:

*   **Refresh Token Cookie:**
    *   `SameSite=Strict`: Protects against cross-site request forgery without third-party cookie blocking issues.
    *   `Path=/api/v1/auth/`: Scopes token transmission exclusively to authentication endpoints (`/login/`, `/token/refresh/`, `/logout/`).
    *   `HttpOnly=True`: Inaccessible to JavaScript memory (`localStorage`/`sessionStorage`).
    *   `Secure=True`: Enforced automatically in production when `DEBUG=False`.
*   **Host & Origin Allowlists (Backend):**
    *   `ALLOWED_HOSTS`: Validates the canonical backend host `gridy-backend.onrender.com` and local development hosts. Broad platform wildcards (`.onrender.com`, `.vercel.app`) are rejected.
    *   `CSRF_TRUSTED_ORIGINS`: Configured specifically with `https://gridy.vercel.app`, `https://gridy-backend.onrender.com`, and local development origins. Arbitrary platform subdomains are not trusted.
    *   `CORS Policy`: Web browser clients communicate via the same-origin reverse proxy and do not invoke CORS. Native mobile applications (Flutter) do not run within a browser sandbox and do not use CORS. Broad production regexes are removed; `CORS_ALLOWED_ORIGINS` accepts only explicitly configured origins.

---

## 3. Environment Management

Strict separation of configuration across environments:
*   `SECRET_KEY` & `ADMIN_REGISTRATION_PASSKEY`
*   `DATABASE_URL` (PostgreSQL connection string)
*   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, & `CLOUDINARY_API_SECRET`
*   `FIREBASE_SERVICE_ACCOUNT_JSON_PATH` (mounted as a Secret File on Render)
*   `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, & `DEFAULT_FROM_EMAIL`
*   `VITE_API_BASE_URL` (leave unset or `/api/v1` for production same-origin builds; `http://127.0.0.1:8000/api/v1` for local development)
*   `REFRESH_COOKIE_SAMESITE` (defaults to `Strict`)

### Runtime guarantees and scale-out gates

The current notification implementation starts daemon threads in the API process. An API success response means the work was accepted by the process, not that SMTP or FCM delivered it; process termination can interrupt the work and there is no persistent queue or retry. This is the low-dependency behavior selected by [ADR 009](decisions/009-simplification-to-defended-proposal-architecture.md) and bounded for pilot planning by [ADR 013](decisions/013-pilot-notification-and-throttle-guardrails.md). Treat notification delivery as best-effort unless a separate durable delivery design is reviewed and accepted by the responsible owner.

DRF scoped throttles use Django's default `LocMemCache`. Each of the three Gunicorn workers has its own in-memory counters, and replicas do not share them. Configured rates are therefore approximate request budgets, not brute-force or denial-of-service controls. Before relying on consistent abuse protection or increasing replicas, evaluate and test a shared cache or edge enforcement mechanism. A single replica does not make the worker-local counters global.

These constraints document current behavior and future decision gates; they do not configure Azure resources, select a shared service, or record production-owner acceptance.

### Rolling schema changes and rollback

The M43 one-shot migration job and M44 CI smoke establish migration ordering and failure blocking. They do not prove that an older API revision can use the schema after a newer release migrates it. For schema changes that may overlap application revisions, follow the expand/backfill/switch/contract sequence in [ADR 014](decisions/014-safe-schema-rollout-compatibility.md) and test the specific prior and new application versions against disposable PostgreSQL before rollout. Delay destructive schema operations until older revisions are stopped and the rollback window has closed.

A code rollback is safe only when the current schema remains compatible with the prior revision. Do not assume migrations can be reversed; choose a tested forward repair or an explicitly approved backup restore with its data-loss window recorded. M43's removal of startup-time `hostaddr` pinning does not prove reconnect after a live PostgreSQL DNS change. A controlled DNS failover/reconnect rehearsal remains a separate non-production pilot gate.

---

## 4. Mobile Distribution

*   The Flutter application compiles into an Android `.apk` (and optionally an iOS `.ipa`).
*   Mobile clients connect directly to the API endpoint (`https://gridy-backend.onrender.com/api/v1`) via `--dart-define=API_BASE_URL`. Because mobile HTTP clients are not subject to browser origin controls, they do not require or use CORS permissions.
*   For staged LGU field rollouts, direct APK distribution via GitHub Releases or Firebase App Distribution is utilized.
