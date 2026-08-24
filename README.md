# Gridy - Barangay Information and Service Management System

Gridy is an enterprise-grade web and mobile platform designed to modernize and digitize local government operations (Barangays). It provides a secure, role-based ecosystem for residents to request documents, report local issues, and stay informed via real-time notifications.

## System Architecture

Gridy employs a highly decoupled, microservices-inspired architecture designed to scale. The entire ecosystem is containerized to guarantee 100% environment parity between local development and production.

- **Backend Engine (Django & DRF):** Powers the core REST API (Python 3.12). Handles complex relational business logic, OpenAPI schema generation, and JWT validation.
- **Frontend Web Admin (React & Vite):** A Single Page Application (SPA) providing a responsive, Tailwind-styled dashboard for Barangay Officials and DILG Superadmins.
- **Resident Portal (Flutter):** A cross-platform mobile application allowing residents to report issues with image uploads, request documents, and view community schedules on the go.
- **Primary Database (PostgreSQL 15):** Serves as the robust, ACID-compliant relational data store, heavily optimized with composite indices for rapid dashboard filtering.
- **Message Broker & Cache (Redis 7):** Brokers background task queues and acts as an ultra-low-latency caching layer for session management.
- **Asynchronous Task Queue (Celery):** Offloads heavy operations (like third-party Firebase network requests) from the main Django HTTP thread to background workers, ensuring zero UI blocking.
- **Reverse Proxy & Static Hosting (Nginx):** Acts as the primary web server, serving the compiled React frontend as static assets while efficiently proxying dynamic API requests to Gunicorn.
- **Cloud CDNs:** Leverages **Cloudinary** for scalable, ephemeral media storage (e.g., incident report photos) and **Firebase Cloud Messaging** for push notifications.

## Core Features

- **Role-Based Access Control (RBAC):** Strict view-level and object-level permission classes. ViewSets dynamically branch their `get_queryset()` logic based on user roles (`ADMIN` vs `RESIDENT`) to completely prevent unauthorized data exposure.
- **Document Requests & Smart Queuing:** Residents can digitally request clearances and certificates. The system automatically provisions sequential Queue Tickets (e.g., `T001`, `T002`) and tracks real-time fulfillment status.
- **Advanced Analytics:** Dynamic scenario breakdown and hotspots tracking allowing administrators to spot trends (e.g. night-time incidents) and allocate resources effectively.
- **Issue Reporting & Media Handling:** Residents can report local hazards directly from the Flutter Mobile App. The backend implements multipart parsing to compress and stream image attachments directly to Cloudinary without bloating the local Docker container.
- **Real-Time Push Notifications:** Comprehensive Firebase Admin SDK integration. The system dispatches single-device alerts (for queue advancements) and topic-based broadcasts (for general announcements) natively to iOS/Android devices.
- **Secure Authentication:** JWT-based identity management utilizing `HttpOnly`, `SameSite=Strict` cookies. Features seamless Axio interceptors for automatic token refreshing, rendering the system highly resilient against XSS and CSRF attacks.
- **Administrative Auditing:** A dedicated `gridy_audit` module automatically logs all official administrative actions (e.g., approving a document) to ensure complete government transparency and accountability.

## Quickstart

### 1. Backend & Web Frontend (Docker Environment)

The entire web application stack is containerized. To spin up the system locally:

```bash
# Clone the repository
git clone https://github.com/ur1el0/Gridy.git
cd Gridy

# Boot the Containers
docker compose up --build -d
```

_Note: The backend `entrypoint.sh` automatically runs database migrations upon boot._

The API browsable UI will be available at: [http://127.0.0.1:8000/api/v1/](http://127.0.0.1:8000/api/v1/)
The Web Dashboard will be available at: [http://127.0.0.1:5173/](http://127.0.0.1:5173/) (or your configured React port).

### 2. Local Python Setup (Without Docker)

If you prefer to run it locally without Docker:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

python backend/manage.py makemigrations
python backend/manage.py migrate
python backend/manage.py runserver
```

### 3. Mobile App (Flutter)

To run the Resident Portal mobile app:

```bash
cd mobile
flutter pub get
flutter run
```

---

## Testing and Quality Assurance

The codebase includes an automated unit and integration test suite verifying endpoints, authorization boundaries, date validations, and transaction rollbacks.

To run the complete test suite:

```bash
docker compose exec backend pytest
```
