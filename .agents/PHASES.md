# Gridy - Development Phases

This document outlines the macro-level roadmap for the Gridy project.

## Phase 1: Foundation & Authentication (Completed)
- Django setup, Custom User Models, JWT Authentication.
- React frontend scaffold, login/registration forms, routing.

## Phase 2: Core Services & RBAC (Completed)
- Document Requests CRUD operations.
- Granular permissions (Residents vs. Admins).
- PDF Generation logic for approved documents.

## Phase 3: Live Queue & Dashboard (Completed)
- Real-time queue ticket generation.
- Dashboard for Admins to manage walk-ins.
- Document request lifecycle refinement (Processing, Ready for Pickup).

## Phase 4: Issue Reporting & Communications (Completed)
- Community Issue tracking with image uploads.
- Global Announcements and Bulletin Boards.

## Phase 5: Notifications & Observability (Planned)
- Firebase Push Notifications (FCM) integration via Celery.
- System health monitoring endpoints (`/api/health/`).
- Comprehensive Audit Logging.

## Phase 6: Mobile Client (Flutter) (Future)
- Port Resident features (Requesting, Queuing, Reporting) to a cross-platform mobile application.
