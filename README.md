# Gridy - Barangay Information and Service Management System

Gridy is an enterprise-grade web and mobile platform designed to modernize and digitize local government operations (Barangays). It provides a secure, role-based ecosystem for residents to request documents, report local issues, and stay informed via real-time notifications.

## System Architecture

Gridy employs a highly decoupled, microservices-inspired architecture designed to scale. The entire ecosystem is containerized to guarantee 100% environment parity between local development and production.

- **Backend Engine (Django & DRF):** Powers the core REST API (Python 3.12). Handles complex relational business logic, OpenAPI schema generation, and JWT validation.
- **Frontend Web Admin (React & Vite):** A blazing-fast Single Page Application (SPA) providing a responsive, Tailwind-styled dashboard for Barangay Officials.
- **Primary Database (PostgreSQL 15):** Serves as the robust, ACID-compliant relational data store, heavily optimized with composite indices for rapid dashboard filtering.
- **Message Broker & Cache (Redis 7):** Brokers background task queues and acts as an ultra-low-latency caching layer for session management.
- **Asynchronous Task Queue (Celery):** Offloads heavy operations (like third-party Firebase network requests) from the main Django HTTP thread to background workers, ensuring zero UI blocking.
- **Reverse Proxy & Static Hosting (Nginx):** Acts as the primary web server, serving the compiled React frontend as static assets while efficiently proxying dynamic API requests to Gunicorn.
- **Cloud CDNs:** Leverages **Cloudinary** for scalable, ephemeral media storage (e.g., incident report photos) and **Firebase Cloud Messaging** for push notifications.

## Core Features

- **Role-Based Access Control (RBAC):** Strict view-level and object-level permission classes. ViewSets dynamically branch their `get_queryset()` logic based on user roles (`ADMIN` vs `RESIDENT`) to completely prevent unauthorized data exposure.
- **Document Requests & Smart Queuing:** Residents can digitally request clearances and certificates. The system automatically provisions sequential Queue Tickets (e.g., `T001`, `T002`) and tracks real-time fulfillment status.
- **Issue Reporting & Media Handling:** Residents can report local hazards. The backend implements multipart parsing to compress and stream image attachments directly to Cloudinary without bloating the local Docker container.
- **Real-Time Push Notifications:** Comprehensive Firebase Admin SDK integration. The system dispatches single-device alerts (for queue advancements) and topic-based broadcasts (for general announcements) natively to iOS/Android devices.
- **Secure Authentication:** JWT-based identity management utilizing `HttpOnly`, `SameSite=Strict` cookies. Features seamless Axio interceptors for automatic token refreshing, rendering the system highly resilient against XSS and CSRF attacks.
- **Administrative Auditing:** A dedicated `gridy_audit` module automatically logs all official administrative actions (e.g., approving a document) to ensure complete government transparency and accountability.

## Quickstart (Docker Production Environment)

The entire application stack is containerized. To spin up the system locally:

1. **Clone the repository:**

```bash
docker compose exec backend pytest
```

### 2. Install Project Dependencies

```bash
cd backend/
pip install -r requirements.txt
```

### 3. Setup Database & Migrations

```bash
docker compose exec backend python manage.py seed_db
```

4. **Access the Application:**
   - **Web Dashboard:** `http://localhost:80`
   - **API Swagger/OpenAPI Docs:** `http://localhost:8000/api/schema/swagger-ui/`

## Environment Variables

To run the project, you must create a `.env` file in the `backend/` directory based on `.env.example`:

- `SECRET_KEY`: Django cryptographic key
- `DEBUG`: Set to `True` for development, `False` in production
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`: PostgreSQL container credentials
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Media storage credentials
- `FIREBASE_SERVICE_ACCOUNT_JSON_PATH`: Path to FCM credentials for push notifications

## Project Structure

- `backend/`: Django core application, REST APIs, and Celery task definitions
  - `gridy_auth/`: JWT Authentication, User Models, Profiles
  - `gridy_services/`: Document Requests and Queue Ticket logic
  - `gridy_communications/`: Announcements, Activities, FCM logic
  - `gridy_reports/`: Resident Issue Reporting and image handling
  - `gridy_audit/`: System action logging
- `frontend/`: React + Vite web dashboard for Barangay Officials
- `docker-compose.yml`: Services orchestration configuration

## Testing

The backend is fully verified with comprehensive unit and integration tests. To execute the test suite inside the container:

```bash
# With venv activated inside backend/
python manage.py test
```

---

## Key Endpoints Reference

### Authentication

- `POST /api/v1/auth/register/` - Create a resident profile.
- `POST /api/v1/auth/login/` - Authenticate and fetch access/refresh JWT tokens.
- `GET /api/v1/auth/me/` - Fetch currently logged-in account details.
- `POST /api/v1/auth/import-residents/` - (Admin only) Upload CSV spreadsheet to batch import residents.

### Services & Queue

- `POST /api/v1/document-requests/` - Request certificates.
- `PATCH /api/v1/document-requests/<id>/validate/` - (Admin only) Approve/Reject certificate requests.
- `POST /api/v1/tickets/` - Get queue ticket position (auto-generates ticket number).
- `GET /api/v1/tickets/live-status/` - Fetch live queue positions.
- `POST /api/v1/tickets/next/` - (Admin only) Advance queue to next active ticket.

### Communications & Incident Reporting

- `POST /api/v1/reports/` - Submit hazard reports with photo uploads.
- `POST /api/v1/announcements/` - (Admin only) Broadcast official board announcements.
- `POST /api/v1/devices/` - Register FCM device token for push notifications.
