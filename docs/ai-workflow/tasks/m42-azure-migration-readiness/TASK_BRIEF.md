# Task Brief: M42 — Azure Migration Readiness Assessment

## 1. Metadata

- **Task ID:** `m42-azure-migration-readiness`
- **Task Type:** Architecture audit and migration planning
- **Target Components:** Deployment, CI/CD, database, media, notifications, security, operations
- **Lead / Writer / Reviewer:** Codex (user-directed sole-agent mode)
- **Branch:** `audit/m42-azure-migration-readiness`
- **Base:** M41 head `bf6a649c7970651a6cb837e964f5874bf882e3fb`; M41 PR #172 is open against `main`.

## 2. Objective & Scope

- **Goal:** Produce a code-evidenced recommendation on whether and how KapitBayan should migrate from its configured Render/Vercel deployment to Azure, including a phased transition and explicit decision gates.
- **Non-goals:** Do not provision Azure resources, change DNS, access production data, configure credentials, change application/configuration code, move user data, deploy, or claim a final cost without usage, region, and subscription inputs. UniPM comparison/adoption is a separate follow-up.
- **Problem statement:** The user previously asked about an Azure migration and directed that the original roadmap be completed first. The repository roadmap marks Phases 1–7 complete; M41 adds cloud CI for pushed development branches. This assessment is the first bounded post-roadmap Azure step.

## 3. Current Behavior & Evidence To Verify

- `architecture/11-deployment-and-ci-cd.md` documents Render for Django/PostgreSQL and Vercel for the web SPA, with `/api/v1` reverse proxying to preserve same-origin refresh-cookie behavior.
- `docker-compose.yml`, backend/frontend Dockerfiles, and `.github/workflows/ci.yml` define the current container and CI baseline; M41 enables branch-push CI and manual dispatch.
- The architecture and ADRs describe Cloudinary media storage, Firebase Cloud Messaging, SMTP email, and native `@async_task` daemon-thread work (ADR 009), all of which affect a hosting move.
- The deployed database and cloud-provider configuration are not available for live inspection in this task. All claims must be labeled as repository configuration, cloud-documentation fact, or unverified operational state.

## 4. Required Business & Architectural Rules

- Preserve the same-origin web API and HttpOnly refresh-cookie contract unless a separately reviewed migration proves an alternative secure.
- Preserve barangay tenant isolation, RBAC, audit behavior, private resident evidence access, and payment/receipt integrity.
- No Celery or Redis adoption by default; assess whether current in-process asynchronous tasks survive container restarts and scale-out.
- No live migration, data export, production access, resource provisioning, DNS change, or deployment in this assessment.
- Treat personal and resident evidence data as sensitive; do not assume a region or regulatory conclusion. Flag data residency and LGU/legal review as decision gates.
- Distinguish confirmed repository facts from assumptions and suggestions.

## 5. Observable Acceptance Criteria

1. [x] Inventory current web/API/database/container topology and CI behavior from tracked source and documentation.
2. [x] Inventory external services and application behaviors relevant to migration (Cloudinary, Firebase, SMTP, cookies/CORS/hosts, async tasks, health checks, scheduled work if present).
3. [x] Compare Azure service patterns that can preserve the current same-origin API contract; explain trade-offs and avoid selecting services only by familiarity.
4. [x] Identify migration blockers and operational requirements for database transfer, media, secrets/identity, background tasks, observability, scaling, backups, rollback, and domain cutover.
5. [x] Give a recommendation with confidence, prerequisites, phased implementation milestones, test/rollback gates, and explicit no-go conditions.
6. [x] Avoid unsupported exact monthly-cost claims; list inputs needed for a reproducible Azure Pricing Calculator estimate.
7. [x] Record official Microsoft sources and their access date; verify region/service claims against current official documentation.
8. [x] Make no application, dependency, schema, cloud-resource, production-data, DNS, or secret changes. Keep unrelated primary-worktree files untouched.
9. [x] `git diff --check` passes and only the M42 planning/audit packet is changed in this branch.

## 6. Relevant Files & Affected Areas

- `architecture/11-deployment-and-ci-cd.md`
- `architecture/01-system-overview.md`
- `architecture/09-security-and-rbac.md`
- `architecture/decisions/002-refresh-token-and-session-hardening.md`
- `architecture/decisions/004-multi-tenant-barangay-isolation.md`
- `architecture/decisions/009-native-async-task-execution.md`
- `docker-compose.yml`
- `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, `frontend/vercel.json`
- `.github/workflows/ci.yml`
- Backend media, notification, health-check, and async-task implementation references found during audit.
- Deliverable: `docs/ai-workflow/tasks/m42-azure-migration-readiness/AUDIT.md`

## 7. Constraints & Known Risks

- Azure service availability, regional support, product tiers, and pricing can change; use official Microsoft documentation current at audit time.
- The repository does not contain production traffic, data-size, RPO/RTO, subscription, negotiated pricing, or DNS ownership facts. Do not fabricate them.
- A cloud migration can create data-loss, downtime, cookie/origin, egress, and recurring-cost risk. Recommend a parallel non-production pilot and tested rollback before any production cutover.
- M41 is not merged yet; keep M42 stacked on M41 and do not retarget M41's PR or merge either PR.
