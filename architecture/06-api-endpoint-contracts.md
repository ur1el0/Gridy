# 06 API Endpoint Contracts

## 1. RESTful Design & Security Boundary
All protected endpoints enforce authorization using short-lived JWT Bearer tokens passed via the HTTP `Authorization` header:

`Authorization: Bearer <access_token>`

Per **ADR 002 (HttpOnly Cookie Authentication)**, refresh tokens are never returned in response payloads or stored in JavaScript memory (`localStorage`/`sessionStorage`). Under the intended production architecture (configured same-origin reverse proxy, see `architecture/11-deployment-and-ci-cd.md`), the web frontend is configured to use a same-origin reverse proxy (Vercel rewrites to `https://gridy-backend.onrender.com` / Docker Nginx proxying to Gunicorn), so browser requests target `/api/v1` directly on the frontend origin. Refresh tokens are scoped to `Path=/api/v1/auth/` and transmitted within secure, server-managed `HttpOnly; SameSite=Strict` cookies. The policy is configurable via `REFRESH_COOKIE_SAMESITE`; if direct cross-origin API access without a reverse proxy is deployed, `SameSite=None` and `Secure=True` are required alongside strict `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`.

---

## 2. API Endpoints

### 2.1 Authentication & Census Module

#### POST `/api/v1/auth/login/`
*   **Description:** Authenticates user credentials. Returns an access token in JSON and sets a rotating refresh token in an `HttpOnly` cookie.
*   **Payload (JSON):**
    ```json
    {
      "username": "resident_username",
      "password": "securepassword"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "access": "eyJhbGciOi...",
      "role": "RESIDENT",
      "user_id": 42,
      "username": "resident_username",
      "barangay": "Barangay Guadalupe"
    }
    ```
*   **Response Headers:**
    `Set-Cookie: refresh_token=eyJhbGciOi...; HttpOnly; Path=/api/v1/auth/; SameSite=Strict`

#### POST `/api/v1/auth/token/refresh/`
*   **Description:** Obtains a fresh access token using the rotating cookie-backed refresh session.
*   **Payload:** Empty (cookie read automatically).
*   **Response (200 OK):**
    ```json
    {
      "access": "eyJhbGciOi..."
    }
    ```
*   **Response Headers:**
    `Set-Cookie: refresh_token=eyJhbGciOi...; HttpOnly; Path=/api/v1/auth/; SameSite=Strict`

#### POST `/api/v1/auth/register/`
*   **Description:** Self-service registration endpoint for residents. Mandates uploading at least one valid image of an accepted proof document: PhilSys ID (`philsys_id_photo`), secondary government ID (`secondary_id_photo`), or utility billing proof (`utility_billing_photo`). A typed PhilSys ID number alone is rejected with HTTP 400. Created accounts start in a pending verification state (`is_verified=False`).
*   **Payload (Multipart Form):**
    *   `username`: string (required)
    *   `password`: string (required)
    *   `email`: string (required)
    *   `full_name`: string (required)
    *   `birth_date`: date (YYYY-MM-DD, required)
    *   `barangay_id`: integer (required)
    *   `privacy_consent`: boolean (`true`, required)
    *   `privacy_consent_version`: string (required)
    *   `philsys_id_photo`: image file (optional, satisfies proof requirement)
    *   `secondary_id_photo`: image file (optional, satisfies proof requirement)
    *   `utility_billing_photo`: image file (optional, satisfies proof requirement)
*   **Response (201 Created):** `User` instance.

#### POST `/api/v1/auth/import-residents/`
*   **Description:** Bulk imports residents from a Registry of Barangay Inhabitants (RBI) CSV file (Barangay Official only). Unlike self-service registration, historical census records do not require uploaded proof images; the authorized official's import serves as an administrative residency attestation. Auto-assigns residents strictly to the official's barangay, sets `is_verified=True`, provisions unusable passwords (`password=None`), and durably logs audit provenance to `AuditLog` with batch and resident-level linkages.
*   **Payload (Multipart Form):**
    *   `file`: CSV file containing columns `username`, `email`, `full_name`, `birth_date`, `purok`, `contact_number`, `voter_status`.
*   **Response (200 OK / 207 Multi-Status):**
    ```json
    {
      "imported": 28,
      "skipped_due_to_duplicate": 0,
      "errors": []
    }
    ```

---

### 2.2 Documents & Clearance Operations Module

#### GET `/api/v1/documents/`
*   **Description:** List clearance requests. Standard residents see only their own requests; Barangay Officials see digital requests from their barangay plus physical walk-in records.
*   **Response (200 OK):**
    ```json
    [
      {
        "id": 105,
        "is_walkin": false,
        "requester_name": "Maria Santos",
        "document_type": "Barangay Clearance",
        "purpose": "Local Employment",
        "status": "RELEASED",
        "urgency_tag": "REGULAR",
        "or_number": "OR-2026-089",
        "fee_amount": "50.00",
        "admin_notes": "Paid at treasury desk."
      }
    ]
    ```

#### POST `/api/v1/documents/`
*   **Description:** Apply for a document clearance. Accessible to both verified residents (self-service) and officials (walk-in clearance creation).
*   **Payload - Resident Self-Service (JSON):**
    ```json
    {
      "document_type": "Barangay Clearance",
      "purpose": "Passport Application",
      "urgency_tag": "REGULAR"
    }
    ```
*   **Payload - Official Recording Walk-in Clearance (JSON):**
    ```json
    {
      "document_type": "Barangay Clearance",
      "purpose": "Job Application",
      "walkin_name": "Pedro Penduko",
      "walkin_purok": "Purok 4",
      "or_number": "OR-2026-090",
      "fee_amount": "50.00",
      "status": "RELEASED",
      "admin_notes": "Walk-in resident paid at treasury desk."
    }
    ```
*   **Response (201 Created):** `DocumentRequest` JSON instance.

#### PATCH `/api/v1/documents/<id>/validate/`
*   **Description:** Official review and treasury recording endpoint (Barangay Official only).
*   **Payload (JSON):**
    ```json
    {
      "status": "RELEASED",
      "or_number": "OR-2026-091",
      "fee_amount": "50.00",
      "admin_notes": "Clearance released and fee audited."
    }
    ```
*   **Response (200 OK):** Updated `DocumentRequest` JSON instance.

#### GET `/api/v1/documents/<id>/generate_pdf/`
*   **Description:** Generates and streams a legal, print-ready PDF certificate containing official barangay headers, QR control verification, and the Treasury Assessment Slip.
*   **Response (200 OK):** Binary PDF stream (`Content-Type: application/pdf`).

---

### 2.3 Live Queue Module

#### GET `/api/v1/queue/live-status/`
*   **Description:** Returns the active serving ticket and remaining waiting count strictly for the authenticated user's assigned barangay.
*   **Response (200 OK):**
    ```json
    {
      "current_ticket": "T008",
      "total_waiting": 4,
      "avg_wait_mins": 8
    }
    ```

#### POST `/api/v1/queue/next/`
*   **Description:** Advances the queue. Marks the currently serving ticket in the official's barangay as `COMPLETED` and transitions the next waiting ticket to `SERVING` for synchronized interval polling clients (Barangay Official only).
*   **Response (200 OK):**
    ```json
    {
      "current_ticket": "T009",
      "remaining_waiting": 3
    }
    ```

---

### 2.4 Executive Dashboard Analytics Module

#### GET `/api/v1/dashboard/summary/`
*   **Description:** Multi-metric analytics endpoint providing pre-calculated aggregations for executive desks (Barangay Official only).
*   **Response (200 OK):**
    ```json
    {
      "total_residents": 482,
      "document_requests": {
        "total": 64,
        "pending": 5,
        "approved": 2,
        "rejected": 1,
        "released": 56,
        "total_revenue": 2800.00
      },
      "issue_reports": {
        "total": 18,
        "pending": 3,
        "in_progress": 2,
        "resolved": 13,
        "urgency_breakdown": {
          "minor": 8,
          "moderate": 5,
          "hazard": 3,
          "emergency": 2
        },
        "category_breakdown": {
          "peace_and_order": 4,
          "public_health": 3,
          "infrastructure": 8,
          "environment": 2,
          "other": 1
        }
      },
      "demographics": {
        "purok_distribution": {
          "Purok 1": 120,
          "Purok 2": 95,
          "Purok 3": 110,
          "Purok 4": 85,
          "Purok 5": 72
        },
        "age_demographics": {
          "youth": 124,
          "young_adult": 168,
          "adult": 140,
          "senior": 50
        }
      },
      "queue_activity": {
        "serving_now": "T008",
        "waiting_in_queue": 4
      }
    }
    ```

---

### 2.5 System Health & Observability
 
#### GET `/api/v1/health/`
*   **Description:** System heartbeat and dependency health probe per ADR 009. Checks PostgreSQL connection latency and local in-memory cache responsiveness without external broker dependencies.
*   **Response (200 OK):**
    ```json
    {
      "status": "healthy",
      "timestamp": "2026-09-09T14:48:48.659073+00:00",
      "services": {
        "database": {
          "status": "healthy",
          "latency_ms": 11.19
        },
        "cache": {
          "status": "healthy",
          "latency_ms": 0.36
        }
      }
    }
    ```