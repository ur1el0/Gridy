# ADR 009: Stack Simplification & Defended Capstone Proposal Alignment

## Status
Accepted (Supersedes Celery/Redis portion of ADR 001)

## Context
During initial development, experimental distributed dependencies (Celery worker, Redis message broker/cache, Daphne ASGI server, Channels WebSockets, Prometheus, and Grafana) were introduced into the repository. 

An unvarnished architectural audit against the approved and defended Capstone manuscript (*Gridy: A Web and Mobile-Based Barangay Information and Service Management System*, MSEUF CCMS BSIT) revealed:
1. **Contractual Scope Mismatch:** Table II ("Software Specifications") explicitly contracts a clean 3-tier architecture: **React + Vite**, **Django + DRF**, **PostgreSQL**, and **Flutter**. Celery, Redis, Channels, and Prometheus were unapproved additions.
2. **Operational Fragility:** Running 7 concurrent Docker containers consumed ~1.8 GB of RAM and triggered multi-container race conditions (e.g., Celery worker attempting to run database migrations concurrently with Daphne).
3. **Hardware Constraints:** Partner LGUs (Barangay Ibabang Dupay and Barangay Daungan) operate on standard office workstations where complex distributed container orchestrations are impractical.

## Decision
We decommissioned Celery, Redis, Channels, and Daphne across the entire codebase and aligned the system directly with the defended proposal:
1. **Asynchronous Background Execution:** Replaced Celery's `@shared_task` with a native non-blocking daemon thread decorator (`@async_task` utilizing `threading.Thread(daemon=True)`). It maintains `.delay()` call-site compatibility so Firebase push notifications and welcome emails execute in the background with zero external broker dependencies.
2. **Real-Time Queue Synchronization:** Replaced WebSocket channel layers with lightweight 3-second HTTP interval polling (`setInterval(fetchTickets, 3000)`), achieving architectural uniformity across desktop web, citizen kiosks, and the Flutter mobile app.
3. **Pure 3-Tier Container Topology:** Reduced `docker-compose.yml` to 3 core services:
   - `gridy_db` (PostgreSQL 15)
   - `gridy_backend` (Django DRF)
   - `gridy_frontend` (Vite + Nginx)
4. **Presentation Fixtures:** `seed_barangays` and `seed_demo_analytics` create clearly labeled synthetic records for local development and presentations. Demo-only accounts have unusable passwords; the seed commands require an explicit flag, `DEBUG=True`, and a local database host. Production builds only migrate the schema and never create fixture users or records.

## Consequences
- **Positive:** System memory footprint reduced by over 60%; eliminated container migration races and port conflicts; 100% test suite pass rate (40/40 backend, 10/10 frontend); flawless alignment with the defended Capstone 1 manuscript.
- **Trade-off:** In-process daemon threads do not persist queued tasks across process restarts; acceptable given task volume (instant transactional emails and push notifications) and aligned with academic and LGU operational scale.
