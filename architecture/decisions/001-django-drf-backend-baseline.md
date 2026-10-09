# ADR 001: Django & Django REST Framework (DRF) Backend Baseline

## Status
Accepted (Asynchronous Task Queue superseded by ADR 009)

## Context
Gridy requires a structured, scalable backend framework to implement a secure Barangay Management & Resident Engagement system. The system needs built-in support for:
- Role-Based Access Control (RBAC)
- Relational database transactions (for queuing tickets and document validation pipeline)
- Task queues (for sending notifications and running background analytics metrics checks)
- RESTful JSON API endpoint schemas

## Decision
We chose Django combined with Django REST Framework (DRF) as our core backend platform.
- **Relational Storage**: PostgreSQL in production (fallback to SQLite in development for lightweight testing environments).
- **Asynchronous Task Queue**: Celery backed by Redis for offloading long-running notifications and scheduled cron analytics tasks. *(Note: Superseded by ADR 009, which decommissioned Celery/Redis in favor of native `@async_task` daemon threads and HTTP polling to eliminate distributed fragility on barangay workstations).*

## Consequences
- Django’s built-in ORM ensures transaction safety and simplified database migrations mapping.
- DRF provides serialization utilities and ViewSet architectures that reduce boilerplate API routing.
- Developers previously needed to manage Redis/Celery; this operational overhead was subsequently removed in ADR 009.
