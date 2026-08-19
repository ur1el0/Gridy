# Gridy - Product Requirements Document (PRD)

## 1. Project Overview
**Gridy** is a Barangay Information and Service Management System designed to digitize and streamline local government operations in the Philippines. It serves as a centralized platform for residents to interact with their barangay officials and for officials to manage constituents efficiently.

## 2. Target Audience
- **Residents**: Constituents of the barangay who need to request documents, report issues, and view community announcements.
- **Barangay Officials / Admins**: Local government staff who process document requests, manage queues, resolve community issues, and maintain constituent records.

## 3. Core Features & Modules
### 3.1 Authentication & Authorization (RBAC)
- Resident registration and login.
- Admin dashboard access for verified barangay officials.
- Strict Role-Based Access Control (RBAC) differentiating Resident vs. Admin privileges.

### 3.2 Service Management (Document Requests)
- Residents can request Barangay Clearances, Indigency Certificates, etc.
- Admins can process requests through a strict lifecycle: `PENDING` -> `PROCESSING` -> `READY_FOR_PICKUP` -> `RELEASED` (or `REJECTED`).
- Automated PDF generation for approved documents.

### 3.3 Live Queue System
- Real-time digital queue management for walk-in and online constituents.
- Dashboard for admins to call the next resident in line.
- Support for priority/senior citizen queuing.

### 3.4 Community Issue Reporting
- Residents can report local issues (e.g., broken streetlights, noise complaints) with photo attachments.
- Admins can track and update the resolution status of these issues.

### 3.5 Announcements & Bulletins
- Admins can broadcast announcements and community events to all registered residents.

## 4. Non-Functional Requirements
- **Security**: Data isolation per user. Admins cannot alter resident creation states maliciously.
- **Reliability**: Asynchronous tasks (via Celery/Redis) for push notifications and heavy PDF generation.
- **Accessibility**: High-contrast, responsive UI tailored for mobile devices and varying internet speeds.
