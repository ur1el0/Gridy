# Gridy Frontend Architecture & Features Manual

This document details the core frontend features and architecture implemented in the Gridy Web Application, built using React, TypeScript, and Vite.

---

## 1. Authentication & Demarcation Gateway

* **Dual-Mode Registration**: Supports distinct onboarding pathways for Citizen Residents (requiring birth date, contact info, and optional guardian fields for minors) and Barangay Administrative Personnel (requiring position titles and official domain accounts).
* **Demarcation Gateway (ADR 008)**: Provides a single unified web entry point with an operational demarcation toggle (and `Shift + \` shortcut) on `/login` that switches between Citizen Self-Service Kiosk mode and the Administrative Staff Desk Portal.
* **JWT Context Flow**: Leverages a React `AuthContext` provider to maintain active user session state across the application.
* **Axios Interceptors**: A pre-configured `axiosPrivate` instance automatically attaches Bearer tokens to all outbound API requests. If a `401 Unauthorized` occurs, the interceptor calls `/api/v1/auth/token/refresh/` via rotating `HttpOnly` cookies and replays the original request without forcing re-authentication.
* **Protected Routing**: Wraps administrative desk routes inside `<ProtectedRoute>` components enforcing role verification (`ADMIN`, `FIELD_OFFICIAL`).

---

## 2. Dashboard & Analytics

* **API Integration**: Fetches real-time profile metrics and aggregated summary statistics (`/api/v1/dashboard/summary/`) on component mount.
* **Responsive Layout**: Adapts gracefully across desktop, kiosk, and tablet displays using Tailwind CSS flex and grid utilities.

---

## 3. Document Requests Management

* **Dynamic Data Tables**: Renders active resident clearance and certificate applications with visual status indicators.
* **Treasury Assessment & Validation**: Slide-over review modal allows officials to inspect resident records, record statutory fee assessments and municipal Official Receipt (O.R.) numbers, and update statuses (`PROCESSING`, `READY_FOR_PICKUP`, `RELEASED`, `REJECTED`).
* **PDF Clearance Generation**: Directly streams official PDF documents (`/api/v1/document-requests/<id>/generate-pdf/`) for approved clearances.

---

## 4. Issue Reports Triage

* **Visual Urgency Badges**: Reports are color-coded (Low, Medium, High, Urgent) for rapid prioritization by barangay field staff.
* **Image Lightbox**: Integrates full-screen image inspection fetching Cloudinary CDN URLs attached to resident incident reports.

---

## 5. Live Queue Synchronization

* **Multi-Tier Polling Architecture**: 
  * **Administrative Live Desk**: Polled every 3 seconds (`setInterval(fetchTickets, 3000)`) for real-time ticket progression and counter advancement.
  * **Citizen Self-Service Kiosk**: Polled every 5 seconds (`setInterval(fetchQueueData, 5000)`) for public "Now Serving" board updates without WebSocket overhead.
* **Dual-Panel Counter Interface**:
  * **Now Serving**: Highlights the currently active ticket in high-visibility typography with a one-click completion trigger.
  * **Waiting List**: Displays pending queue tickets with action triggers to dynamically advance the queue.

---

## 6. Communications & Bulletins

* **Announcements Board**: Interfaces with the backend to publish community-wide alerts or pin emergency notices.
* **Activity Schedules**: Dedicated interface to manage upcoming barangay events, youth programs, and community assemblies.