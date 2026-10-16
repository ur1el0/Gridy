# Deployment and CI/CD

## 1. Hosting Infrastructure & Origin Topology

The repository is configured for an intended **Same-Origin Reverse Proxy Architecture** for web production. The names and settings below describe the configured target, not proof that a live deployment currently uses them. Verify the active deployment and forwarded headers before relying on runtime behavior.

*   **Backend & Database:** Intended for **Render.com** with PostgreSQL. Confirm the active service, database, and deploy branch in the provider before treating this as live topology.
*   **Frontend Web Application:** Intended for **Vercel** as a single-page application (SPA). Confirm active domains and project settings in the provider.
    *   **Frontend-origin example in the backend configuration:** `https://gridy.vercel.app`
*   **Reverse Proxy Contract:**
    *   Vercel Edge Rewrites (`frontend/vercel.json`): The checked-in rewrite currently targets `https://gridy.onrender.com/api/v1/:path*`.
    *   Containerized Stack (`frontend/nginx.conf`): Nginx reverse proxies `/api/` traffic directly to `http://backend:8000`.
    *   Client URL Resolution (`frontend/src/api/axios.ts`): Resolves `VITE_API_BASE_URL` to relative `/api/v1` in production when unset. Any configured environment variable overrides this fallback.

### Configuration drift to resolve

The checked-in frontend rewrite targets `gridy.onrender.com`, while `backend/.env.example` uses `gridy-backend.onrender.com` for `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS`. These are inconsistent configuration examples. Verify the actual Render hostname and forwarded `Host`/`Origin` headers, then align the frontend rewrite and backend allowlists before a production release. This documentation records the discrepancy; it does not claim that either hostname is the live service.

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
    *   `ALLOWED_HOSTS`: The example config includes `gridy-backend.onrender.com` and Django may append `RENDER_EXTERNAL_HOSTNAME`. Reconcile this with the Vercel rewrite destination above; do not assume the example matches the active service.
    *   `CSRF_TRUSTED_ORIGINS`: The example lists `https://gridy.vercel.app` and `https://gridy-backend.onrender.com`, plus development origins when `DEBUG=True`. Arbitrary platform subdomains are not trusted. Confirm the actual origins for the deployed frontend and backend.
    *   `CORS Policy`: Web browser clients communicate via the same-origin reverse proxy and do not invoke CORS. Native mobile applications (Flutter) do not run within a browser sandbox and do not use CORS. Broad production regexes are removed; `CORS_ALLOWED_ORIGINS` accepts only explicitly configured origins.

---

## 3. Environment Management

Strict separation of configuration across environments:
*   `SECRET_KEY`
*   `DATABASE_URL` (PostgreSQL connection string)
*   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, & `CLOUDINARY_API_SECRET`
*   `FIREBASE_SERVICE_ACCOUNT_JSON_PATH` (mounted as a Secret File on Render)
*   `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, & `DEFAULT_FROM_EMAIL`
*   `VITE_API_BASE_URL` (leave unset or `/api/v1` for production same-origin builds; `http://127.0.0.1:8000/api/v1` for local development)
*   `REFRESH_COOKIE_SAMESITE` (defaults to `Strict`)

### Runtime guarantees and scale-out gates

The current notification implementation starts daemon threads in the API process. An API success response means the work was accepted by the process, not that SMTP or FCM delivered it; process termination can interrupt the work and there is no persistent queue or retry. This is the low-dependency behavior selected by [ADR 009](decisions/009-simplification-to-defended-proposal-architecture.md) and bounded for pilot planning by [ADR 013](decisions/013-pilot-notification-and-throttle-guardrails.md). Treat notification delivery as best-effort unless a separate durable delivery design is reviewed and accepted by the responsible owner.

Resident private-evidence deletion uses a database-backed cleanup record because storage deletion happens after account erasure commits. File names are encrypted with `SECRET_KEY` before they are stored. Run `python manage.py cleanup_private_evidence` periodically from a single application environment to retry due records; failures remain queued with increasing retry delays. If `SECRET_KEY` is rotated while cleanup records remain, retain the old key in `SECRET_KEY_FALLBACKS` until those records have been deleted. This job uses the existing Django database and does not add Celery or Redis.

Scoped DRF API throttles use the PostgreSQL `APIRateLimitWindow` table, keyed with HMACs and updated under row locks so configured windows are shared across workers. Apply the additive migration before deploying the code and verify concurrency on PostgreSQL; SQLite cannot establish the row-lock behavior. These scoped limits are not a volumetric DDoS defense. Django's separate general-purpose `LocMemCache` remains process-local. See [ADR 016](decisions/016-shared-database-api-throttling.md).

These constraints document current behavior and future decision gates; they do not configure Azure resources, select a shared service, or record production-owner acceptance.

### Rolling schema changes and rollback

The M43 one-shot migration job and M44 CI smoke establish migration ordering and failure blocking. They do not prove that an older API revision can use the schema after a newer release migrates it. For schema changes that may overlap application revisions, follow the expand/backfill/switch/contract sequence in [ADR 014](decisions/014-safe-schema-rollout-compatibility.md) and test the specific prior and new application versions against disposable PostgreSQL before rollout. Delay destructive schema operations until older revisions are stopped and the rollback window has closed.

A code rollback is safe only when the current schema remains compatible with the prior revision. Do not assume migrations can be reversed; choose a tested forward repair or an explicitly approved backup restore with its data-loss window recorded. M43's removal of startup-time `hostaddr` pinning does not prove reconnect after a live PostgreSQL DNS change. A controlled DNS failover/reconnect rehearsal remains a separate non-production pilot gate.

The CI DNS-reconnect smoke uses disposable PostgreSQL containers and Docker's embedded DNS to verify that a persistent Django probe process can recover on a subsequent request after its original connection is interrupted and the service alias moves to another container. It does not model Azure PostgreSQL failover, provider DNS propagation, TLS, or managed-service recovery timing; those remain unverified pilot checks.

---

## 4. Mobile Distribution

*   The Flutter application can be built into an Android `.apk` (and, with the required signing and platform setup, an iOS `.ipa`).
*   Mobile clients connect directly to the verified API endpoint via `--dart-define=API_BASE_URL`. Do not copy the current environment example hostname until the Vercel/Render hostname mismatch is reconciled. Because native clients are not subject to browser origin controls, they do not require or use CORS permissions.
*   GitHub Releases or Firebase App Distribution can be evaluated for staged APK distribution. A release or distribution channel must be verified separately for each build.
