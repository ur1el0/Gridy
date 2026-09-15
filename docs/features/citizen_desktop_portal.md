# Feature Specification: Citizen Desktop Web Portal

## 1. Overview
The Citizen Desktop Web Portal provides a constituent-first, browser-based interface for barangay residents. It mirrors core mobile features—document applications, queue status tracking, community bulletin updates, and incident reporting—while optimizing layout and typography for desktop viewports.

---

## 2. Architecture & Route Structure

Per **ADR 008**, the citizen portal is decoupled from the administrative command center and mounted under `CitizenLayout`:

| Route | Component | Purpose |
| :--- | :--- | :--- |
| `/` or `/portal` | Redirect | Automatically directs authenticated residents to `/portal/documents`. |
| `/portal/documents` | `CitizenDocuments.tsx` | Self-service clearance applications with live status badges and legal PDF download. |
| `/portal/queue` | `CitizenQueue.tsx` | Real-time queue tracker displaying active serving numbers, waiting count, and estimated delay. |
| `/portal/bulletin` | `CitizenBulletin.tsx` | Chronological community announcements feed with category badges and upcoming activity calendar. |
| `/portal/issues` | `CitizenIssues.tsx` | Public incident reporting form supporting image uploads, categorization, and tracking. |

---

## 3. Key Components & Capabilities

### 3.1 Self-Service Document Applications (`CitizenDocuments.tsx`)
*   **Application Modal:** Residents select document types (e.g., Barangay Clearance, Certificate of Indigency) and state their purpose.
*   **Status Tracking:** Visual timeline badges (`PENDING` ➔ `PROCESSING` ➔ `RELEASED`).
*   **Direct PDF Download:** Released certificates feature a "Download Official PDF" button connecting to `/api/v1/documents/<id>/generate_pdf/`.

### 3.2 Live Queue Tracker (`CitizenQueue.tsx`)
*   **Live Metrics:** Shows the current serving ticket (e.g., `T008`), total waiting citizens, and estimated wait minutes (`waiting_count * 2`).
*   **Remote Ticket Generation:** Verified residents can generate a remote queue slip directly from their browser, receiving an assigned ticket number without standing in line.

### 3.3 Citizen Incident Reporting (`CitizenIssues.tsx`)
*   **Media Upload:** Residents can upload photographic evidence (JPEG/PNG up to 5MB) previewed client-side before submission.
*   **Category Triage:** Reports are tagged by category (`Peace and Order`, `Public Health`, `Infrastructure`, `Environment`, `Other`).
*   **Privacy & Ownership:** Residents see only their own filed reports with real-time official resolution status notes.

---

## 4. Secret Role-Switching Demarcation (`Shift + \`)
To prevent public exposure of administrative routes while facilitating unified workstation administration:
*   **Keyboard Trigger:** Pressing `Shift + \` opens the Demarcation Gateway.
*   **Permission Verification:** The modal interrogates the session JWT. If the user possesses `ADMIN` or `DILG_ADMIN` privileges, they can switch directly to the Executive Desk (`/admin/dashboard`). Unprivileged resident accounts receive an access denied notification.