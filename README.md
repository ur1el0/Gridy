# Gridy - Barangay Information and Service Management System

Gridy is a web and mobile barangay information and service management system developed for local government operations. The repository contains a Django REST Framework API, a React Single Page Application (providing administrative desk operations and citizen self-service kiosk mode), and a Flutter mobile application for residents and field personnel.

> **Operational Scope Note:** Gridy is evaluated as a local development prototype for municipal operations. Requisition revenue is audited through municipal Treasury Official Receipts (O.R.) and statutory fee schedules rather than commercial payment gateways. Mobile and web notifications are delivered through Firebase Cloud Messaging and SMTP email. Both web and mobile applications operate as connected REST clients requiring active network connectivity to the Django API.

## Database Baseline & Multi-Tenancy

Gridy requires PostgreSQL 15 or higher. The relational schema enforces multi-tenant boundary isolation across local government jurisdictions:

- **Tenant Scoping:** Operational domain models (`DocumentRequest`, `QueueTicket`, `Announcement`, `Activity`) link directly to a `Barangay` foreign key; citizen hazard reports (`IssueReport`) resolve tenant context through the reporter's registered profile.
- **Composite Indexing:** Targeted composite indices are enforced on high-throughput query boundaries, including `['barangay', 'status']` for document review filtering, `['status', 'created_at']` for lobby queue dispatch, and `['user', 'is_read', '-created_at']` for citizen notifications.
- **Sequential Queue Ticketing:** Queue ticket numbers (e.g., `T001`, `T002`) are sequentially allocated and scoped per barangay tenant, resetting daily at midnight local time.

## System Architecture

Gridy implements a decoupled 3-tier client-server architecture containerized via Docker Compose:

- **Backend API (Django & DRF):** Powers the core REST API (Python 3.12, Django 6.0). Handles relational transactions, OpenAPI schema generation (`drf-spectacular`), and JWT authentication.
- **Frontend Web Application (React & Vite):** Single Page Application (SPA) in TypeScript providing responsive Tailwind-styled interfaces for administrative desk staff and citizen self-service kiosks.
- **Resident & Field Portal (Flutter):** Cross-platform mobile application for residents and field personnel to submit hazard reports with photo attachments, track clearances, and view community schedules.
- **Primary Database (PostgreSQL 15):** Relational data store enforcing ACID compliance, foreign key constraints, and tenant isolation.
- **Background Task Execution:** Non-blocking operations (push alerts and transactional emails) execute via native Python daemon threads (`@async_task`), avoiding external broker dependencies.
- **Queue Synchronization:** 3-second HTTP interval polling across web and mobile clients for synchronized lobby queue status.
- **Reverse Proxy (Nginx):** Serves compiled React frontend assets on port 80 and reverse-proxies `/api/` traffic to the Django backend on port 8000.
- **Cloud Media Storage (Cloudinary):** Remote object storage for resident incident report photo attachments, preventing local container filesystem bloat.

## Current API Surface

The Django REST Framework backend exposes the following contract-driven endpoints under `/api/v1/`:

- `POST /api/v1/auth/login/` & `POST /api/v1/auth/token/refresh/`: JWT authentication with rotating `HttpOnly` cookie session tracking;
- `POST /api/v1/auth/logout/` & `GET /api/v1/auth/me/`: Session invalidation and authenticated profile resolution;
- `/api/v1/document-requests/`: Requisition lifecycle, fee assessment, municipal O.R. assignment, and authenticated PDF certificate generation;
- `/api/v1/tickets/`: Daily sequential ticket issuance, desk status progression (`WAITING` -> `SERVING` -> `COMPLETED`), and public lobby display;
- `/api/v1/reports/`: Citizen hazard reporting with multipart image streaming to Cloudinary storage;
- `/api/v1/announcements/` & `/api/v1/activities/`: Community bulletins and youth/barangay calendar schedules;
- `/api/v1/health/`: System health telemetry monitoring PostgreSQL query latency and local cache responsiveness;
- `/api/schema/swagger-ui/`: Interactive OpenAPI 3.0 contract documentation.

*(Note: Administrative audit logging is enforced internally across service mutations via the `gridy_audit` module rather than a public REST endpoint).*

## Authentication & Session Security

Authentication implements a dual-token strategy designed to protect against XSS and CSRF vulnerabilities:

- **Access Tokens:** Short-lived JWTs (15-minute default) held strictly in client memory. Never persisted in `localStorage` or `sessionStorage`.
- **Refresh Sessions:** Cryptographically random session tokens stored in server-backed `RefreshSession` records and transmitted via `HttpOnly`, `SameSite=Strict` cookies.
- **Token Rotation:** Refresh tokens rotate upon every refresh call (`/api/v1/auth/token/refresh/`). Previous tokens are revoked immediately to prevent replay attacks.
- **Role-Based Access Control (RBAC):** Endpoints enforce viewset-level and query-level isolation across `ADMIN`, `RESIDENT`, and `FIELD_OFFICIAL` roles. ViewSets branch `get_queryset()` to restrict non-administrative users to their own records.

## Quickstart

### 1. Docker Compose (Recommended)

The 3-tier web stack is fully containerized:

```bash
# Clone the repository
git clone https://github.com/ur1el0/Gridy.git
cd Gridy

# Boot the 3-Tier Stack
docker compose up -d --build

# Seed Initial Evaluation Data
docker compose exec backend python manage.py seed_barangays
```

- **Web Portal:** [http://localhost:8080/](http://localhost:8080/)
- **REST API Root:** [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/)
- **OpenAPI Documentation:** [http://localhost:8000/api/schema/swagger-ui/](http://localhost:8000/api/schema/swagger-ui/)
- **Telemetry Health Check:** [http://localhost:8000/api/v1/health/](http://localhost:8000/api/v1/health/)

### 2. Local Setup (Without Docker)

#### Backend (Django)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

python backend/manage.py migrate
python backend/manage.py seed_barangays
python backend/manage.py runserver
```

#### Frontend (React)

```bash
cd frontend
npm ci
npm run dev
```

### 3. Mobile Client (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```

---

## Testing and Quality Assurance

The repository includes automated regression test suites covering authorization boundaries, serializers, transactions, and UI workflows across all three architectural tiers:

```bash
# Run Backend Test Suite (40 unit & integration tests)
./venv/bin/pytest backend

# Run Frontend Test Suite (11 tests across 5 suites)
npm --prefix frontend test -- --run

# Run Mobile Test Suite (42 unit & widget tests)
cd mobile && flutter test

# Run Django System Sanity Check
python backend/manage.py check
```