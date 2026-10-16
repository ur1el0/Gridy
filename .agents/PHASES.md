# KapitBayan - Development Phases

This document outlines the macro-level roadmap for the KapitBayan project.

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

## Phase 5: Notifications & Observability (Completed)
- Firebase Push Notifications (FCM) integration via native `@async_task` daemon threads (ADR 009).
- System health monitoring endpoints (`/api/v1/health/`).
- Comprehensive Audit Logging (`gridy_audit`).

## Phase 6: Architectural Refactoring & Enterprise Standards (Completed)
- Dismantled Django "God Files" (`gridy_auth/views/`, `gridy_services/views/`) into domain-driven packages.
- Refactored monolithic React components (`LiveQueue.tsx`, `DocumentRequests.tsx`) into modular component directories.
- Established strict testing pipelines for modularized code.

## Phase 7: Mobile Client (Flutter) (Completed)
- Cross-platform resident and field official portal for document requesting, live queue tracking, and incident reporting.
- Multi-LGU jurisdiction selection, responsive keyboard layouts, and role guards for DILG administrative routing.
- Native KapitBayan branding, custom density mipmap icons, and production release packaging (`v1.0.1`).