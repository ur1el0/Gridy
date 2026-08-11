# ADR 001: Django & Django REST Framework (DRF) Backend Baseline

## Status
Accepted

## Context
Gridy requires a structured, scalable backend framework to implement a secure Barangay Management & Resident Engagement system. The system needs built-in support for:
- Role-Based Access Control (RBAC)
- Relational database transactions (for queuing tickets and document validation pipeline)
- Task queues (for sending notifications and running background analytics metrics checks)
- RESTful JSON API endpoint schemas

## Decision
We chose Django combined with Django REST Framework (DRF) as our core backend platform.
- **Relational Storage**: PostgreSQL in production (fallback to SQLite in development for lightweight testing environments).
- **Asynchronous Task Queue**: Celery backed by Redis for offloading long-running notifications and scheduled cron analytics tasks.

## Consequences
- Django’s built-in ORM ensures transaction safety and simplified database migrations mapping.
- DRF provides serialization utilities and ViewSet architectures that reduce boilerplate API routing.
- Developers need to manage the configuration and dependencies for Redis and Celery in local and staging environments.
