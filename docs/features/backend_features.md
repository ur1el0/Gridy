# KapitBayan Backend Features Manual

This document details the core backend features and functionalities implemented in KapitBayan.

---

## 1. Authentication & Session Verification
* **SimpleJWT Token System**: Utilizes JSON Web Token (JWT) authorization for secure client-server communication.
* **Token Rotation & Blacklisting**: Enforces security policies where refresh tokens are rotated on usage, and logged-out or invalidated tokens are added to a database blacklist to prevent reuse.
* **Session Verification**: Offers a `/api/v1/auth/me/` endpoint returning current profile states and permissions to verify authentication status.

---

## 2. Role-Based Access Control (RBAC)
Enforces application access controls dividing features between roles:
* **Resident Profile permissions**: Residents can request documents, check queue states, and report incidents.
* **Barangay Official permissions**: Officials can approve/reject document requests, advance the active counter queue, and post bulletins.

---

## 3. Queue Ticketing Pipeline
* **Auto-Sequenced Numbering**: Automatically sequences and formats ticket codes (e.g., `T001`, `T002`, `T003`) upon creation.
* **Counter Management**: Allows officials to call the next resident, updating states between `WAITING`, `SERVING`, `COMPLETED`, and `CANCELLED`.
* **Instant Alerts**: Triggers real-time alerts when counter status changes.

---

## 4. Document Request Workflow
* **Resident Submissions**: Residents submit requests for certifications (e.g. Barangay Clearance, Indigency Certificate) with optional urgency parameters.
* **Official Processing**: Officials audit requests, updating status fields from `PENDING` to `APPROVED`, `REJECTED`, or `RELEASED`.

---

## 5. Incident Reporting System
* **Image Upload Engine**: Residents file reports with photos of hazards, potholes, or emergencies.
* **Cloudinary CDN Integration**: Binary files are compressed and streamed directly to Cloudinary storage, keeping the server database light.
* **Urgency Classifications**: Incident reports feature urgency levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) to assist officials in prioritization.

---

## 6. Notification Dispatcher (FCM)
* **Token Registration**: Registers client devices in a database map to bind tokens to user accounts.
* **Firebase Cloud Messaging Service**: Dispatches push notifications to resident devices when ticket numbers advance or document requests change status.

---

## 7. Operations Analytics Summary
* **Aggregated Dashboard API**: Offers a `/api/v1/dashboard/summary/` metrics route mapping:
  * Document requests status counts.
  * Incident reports urgency breakdown.
  * Active daily queue load statistics.
* **Access Control**: Restricted to authenticated Barangay Officials.
