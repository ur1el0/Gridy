# System Demonstration & Operational Verification Playbook

**Project:** Gridy (Barangay Information and Service Management System)  
**Document Purpose:** End-to-end operational verification workflow, regulatory compliance matrix, and technical architecture specifications.

---

## 1. End-to-End Operational Verification Workflow

The following three-stage workflow validates all primary system capabilities across citizen self-service, administrative adjudication, municipal treasury compliance, and field operations.

### Stage 1: Citizen Self-Service Operations
1. **Identity & Authentication:**
   - Access the resident portal at `/login`.
   - Log in with standard citizen credentials (e.g., `mariasantos`).
   - Verify that administrative navigation controls, financial metrics, and executive modules remain completely cloaked from the constituent view.
2. **Clearance Application:**
   - Navigate to **Documents** (`/portal/documents`).
   - Submit a formal request for a *Barangay Clearance* specifying "Local Employment" as the legal purpose.
   - Verify that the record is persisted with an initial immutable state of `PENDING`.
3. **Remote Queue Ticket Generation:**
   - Navigate to **Queue** (`/portal/queue`).
   - Request a digital service queue ticket.
   - Verify that the system assigns a sequential ticket code (e.g., `T001`), displays the current serving number, and calculates estimated wait time.
4. **Image-Backed Incident Reporting:**
   - Navigate to **Report Incident** (`/portal/issues`).
   - File a community hazard report (e.g., fallen electrical wire or broken streetlight) with an attached photo.
   - Verify that the image is streamed directly to Cloudinary CDN storage and the report appears in the resident's personal tracking feed.

---

### Stage 2: Administrative Desk & Treasury Adjudication
1. **Administrative Demarcation Gateway:**
   - On the workstation, press the keyboard shortcut `Shift + \`.
   - The gateway interrogates the active session claims. Authorized personnel proceed directly to the Executive Desk (`/admin/dashboard`).
2. **Command Dashboard Overview:**
   - Review the four real-time operational aggregates:
     - Total Registered Residents
     - Pending Document Requests
     - Active Community Incident Reports
     - **Clearance Collections (PHP)** (dynamically aggregated via PostgreSQL `Sum('fee_amount')`)
3. **Document Triage & Treasury Verification:**
   - Navigate to **Document Requests** (`/admin/documents`).
   - Open the pending clearance request submitted by Maria Santos.
   - Input the physical **Official Receipt (O.R.) Number** (e.g., `OR-2026-001`) and the statutory **Fee Amount** (e.g., `50.00`).
   - Execute the transition to `RELEASED`.
4. **Watermarked Legal PDF Certificate:**
   - Open the generated PDF certificate.
   - Verify the official LGU header, dynamic QR verification code, authorized official signature line, and the **Official Assessment & Treasury Slip** box establishing financial traceability.

---

### Stage 3: Physical Walk-In Constituent Handling & RBI Census Digestion
1. **Physical Walk-In Handling (Nullable Constituent Architecture):**
   - In Document Management, click **Record Walk-In**.
   - Issue a physical clearance for a non-registered walk-in constituent (e.g., "Pedro Penduko", "Purok 3", fee "50.00").
   - Verify that the system processes statutory fees and issues certificates without creating orphaned authentication accounts.
2. **Bulk Registry of Barangay Inhabitants (RBI) Census Import:**
   - Navigate to **Residents Directory** (`/admin/residents`).
   - Click **Import RBI CSV** and upload a standardized census spreadsheet.
   - Verify that all rows are ingested transactionally, automatically assigned to the active official's barangay jurisdiction, and pre-verified for service delivery.

---

## 2. Technical Architecture & Regulatory Compliance Matrix

| Regulatory & Security Domain | Statutory / Technical Standard | Gridy Architectural Implementation |
|---|---|---|
| **Data Privacy & Tenant Isolation** | **RA 10173** (Data Privacy Act of 2012) | Database querysets are horizontally isolated per barangay tenant (`get_queryset()` strictly filters by `request.user.barangay`). Cross-tenant data leakage is physically prevented at the ORM layer (ADR 004). |
| **Municipal Financial Accountability** | **COA Circulars** & Local Tax Ordinances | Document issuance is coupled with serialized Official Receipt (O.R.) numbers and statutory fee tracking (ADR 007). Cash receipts are aggregated directly in SQL (`Sum('fee_amount')`) for municipal treasury auditability. |
| **Session & Token Security** | **OWASP ASVS** (Session Security) | Dual-layer authentication: 15-minute rotating JWT access tokens paired with HttpOnly, SameSite=Strict rotating refresh session cookies (ADR 002), neutralizing Cross-Site Scripting (XSS) credential theft. |
| **Administrative Cloaking** | **Defense-in-Depth** | Administrative routes (`/admin/*`) are completely decoupled from public interfaces. The `Shift + \` demarcation gateway validates decoded JWT role claims before granting desktop transitions (ADR 008). |
| **Scalable Cloud Media Pipeline** | **Cloud Native / 12-Factor App** | Resident incident photos are streamed directly to Cloudinary CDN storage via `dj3-cloudinary-storage`, maintaining container ephemerality and preventing local disk saturation. |
| **Non-Blocking Background Tasks** | **High Concurrency / Low Latency** | Long-running I/O operations (Firebase Cloud Messaging push alerts and SMTP emails) execute in background daemon threads via `@async_task`, guaranteeing API response latencies under 50ms without Celery/Redis overhead (ADR 009). |