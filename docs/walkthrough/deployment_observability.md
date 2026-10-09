# Containerization & Observability Architecture

This guide details the Docker containerization architecture and the internal observability monitoring endpoints used in the KapitBayan project.

---

## 1. 3-Tier Container Topology (Docker Compose)

In accordance with **ADR 009** (*Stack Simplification & Defended Capstone Proposal Alignment*), the container architecture strictly adheres to the defended 3-tier specification:

* **`gridy_db` (PostgreSQL 15)**: Relational database storing citizen records, clearances, queue tickets, announcements, and audit trails.
* **`gridy_backend` (Django DRF via Gunicorn)**: RESTful API service exposing business logic, role-based authorization, and PDF clearance generation.
* **`gridy_frontend` (React + Vite via Nginx)**: Production administrative and citizen web portal served statically through Nginx on port 80.

This Compose file is for local development and demos. It runs Django's development server; do not use it as the production deployment configuration. Copy `.env.example` to `.env` and `backend/.env.example` to `backend/.env`, then set `POSTGRES_PASSWORD` and `DATABASE_URL` in the root `.env` using the same database credentials. Use `db` as the host, `gridy_db` as the database, and port `5432` in the URL. Set the admin registration passkey in `backend/.env` before starting:

```bash
docker compose up --build
```

---

## 2. Decommissioning of Prometheus & Grafana

During initial prototyping, experimental Prometheus and Grafana monitoring containers were introduced. However:
1. **Contractual Scope Mismatch**: The defended Capstone manuscript (Table II) explicitly contracts a clean 3-tier architecture. Prometheus and Grafana were unapproved additions.
2. **Hardware Constraints**: Partner LGU hardware (Barangay Ibabang Dupay and Barangay Daungan) operate on standard office workstations where complex distributed monitoring agents consume excessive RAM.

Per **ADR 009**, Prometheus and Grafana were fully decommissioned, reducing system memory footprint by over 60%.

---

## 3. Native Observability: Structured Health Check Endpoint

In place of heavy external scraping daemons, KapitBayan exposes a lightweight, enterprise-standard health monitoring route:

* **Endpoint**: `GET /api/v1/health/`
* **Diagnostic Checks**:
  * **Database Latency**: Executes a live SQL probe against PostgreSQL, measuring query round-trip time in milliseconds.
  * **Cache / Memory Status**: Verifies local caching responsiveness.
  * **Service Readiness**: Reports overall HTTP 200 operational readiness without Celery or Redis dependencies.

The backend image runs as an unprivileged user and uses this endpoint as its Docker health check. Docker Compose waits for PostgreSQL readiness before starting backend migrations, then waits for the backend health check before starting the frontend. The database port is bound to localhost for local use.

## 4. Production notification configuration

When `DEBUG=False`, Django refuses to start without SMTP host, username, password, sender address, all three Cloudinary credentials, and an existing Firebase service-account JSON path. Firebase credentials are parsed during application startup; invalid credentials also stop production startup. Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `FIREBASE_SERVICE_ACCOUNT_JSON_PATH` in the deployment environment. Mount the Firebase key at runtime and keep it outside the image and repository. The backend Docker build excludes local media and Firebase JSON files.

Email and push sends run in daemon threads, so a successful API response means the request was accepted by the application, not that a provider delivered it. Provider failures and thread-start failures are logged without recipient identifiers. These threads do not retry and may be interrupted by a process restart. Confirm delivery by configuring valid provider credentials and checking the SMTP/FCM provider logs and the application logs after a real registration or notification event.

## 5. Release rollback and database recovery

Take and verify a database backup before applying a release's migrations. If an application release needs to be rolled back, redeploy the previous application code while leaving the database at its migrated schema; do not reverse migrations `gridy_services.0011` through `0013` or `gridy_auth.0014`. Reversing `0011` removes payment review fields and data, `0012` removes aid requests, and `0013` removes queue call timestamps. The data change in `0014` has no reverse operation, so restoring the former seeded passwords is not supported. Restore a pre-release backup only when the loss of all changes since that backup is acceptable and explicitly intended.
