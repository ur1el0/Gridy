# M42 — KapitBayan Azure Migration Readiness Audit

**Audit date:** 2026-10-11
**Branch:** `audit/m42-azure-migration-readiness`
**Base:** M41 commit `bf6a649c7970651a6cb837e964f5874bf882e3fb`
**Scope:** Repository and official cloud-documentation review. No live Render/Vercel/Firebase/Cloudinary/Azure account or production database was inspected.

## Executive assessment

**Azure is a technically reasonable hosting option, but the application is not ready for a direct production cutover.** The existing Docker images, Django/PostgreSQL design, environment-based configuration, and frontend reverse-proxy contract provide a useful starting point. Two migration blockers need code-level remediation before running multiple API replicas or enabling database high availability: the backend container runs schema migrations whenever an API container starts, and Django settings resolve the database hostname to a fixed IPv4 address once at process startup.

Recommended target for a non-production pilot: **Azure Container Apps for the existing frontend and Django images, with Azure Database for PostgreSQL Flexible Server on private networking**. Keep the web browser's `/api/v1` requests same-origin by exposing the frontend/reverse-proxy app and keeping the API app internal to the Container Apps environment. Keep Cloudinary, Firebase Cloud Messaging, and SMTP unchanged for the first pilot; changing providers or migrating stored resident evidence would add unrelated risk.

This is a **7/10 technical fit, medium confidence; current migration readiness is 4/10**. The ratings reflect repository evidence and currently published Azure documentation, not a live cloud deployment or pricing quote. If the objective is only for CI to keep running while the laptop is off, M41 already provides GitHub-hosted checks for branch pushes; migrating production hosting is unnecessary for that goal. A production move is justified only by a separate requirement such as Azure procurement, governance, private networking, or a measured operational/cost benefit.

**Recommendation:** proceed only with a non-production Azure pilot after the code and business gates below are met. Do not authorize production cutover based on this audit alone.

## Summary of findings

| ID | Severity | Confidence | Category | Assessment |
| --- | --- | --- | --- | --- |
| FINDING-01 | Medium | Confirmed behavior; rollout risk is conditional | Release operations | API container startup executes `migrate` for every app instance. Move migrations to a serialized one-off release step before scale-out or revision rollout. |
| FINDING-02 | Medium | Confirmed behavior; failover impact is conditional | Database reliability | `hostaddr` pins a DNS-derived IP for the process lifetime, which conflicts with managed database failover that updates the hostname's DNS record. |
| FINDING-03 | Low | Confirmed behavior; accepted limitation | Scaling / throttling | `LocMemCache` is per process, so DRF throttles do not share counters across Gunicorn workers or replicas. Current comments explicitly say these are request budgets, not a security boundary. |
| FINDING-04 | Medium | Confirmed and documented limitation | Background work reliability | Daemon-thread email and push work can be interrupted by scale-down, revision shutdown, or restart. ADR 009 accepts best-effort delivery at current scale; confirm that service expectation before scaling. |

There are **0 Critical, 0 High, 2 Medium, and 1 Low confirmed migration risks**, plus **1 Medium documented architectural trade-off**. These findings describe code or policy behavior verified in this checkout; live production settings remain unverified.

## Current system inventory

### Hosting, routing, and CI

- `architecture/11-deployment-and-ci-cd.md` describes the **intended/configured** deployment as Django and managed PostgreSQL on Render with the Vite SPA on Vercel. `frontend/vercel.json` rewrites `/api/v1/:path*` to the Render API. The docs do not establish what is currently deployed or prove the live rewrite behavior.
- Docker Compose runs PostgreSQL 15, Django, and Nginx. The frontend image is a production Nginx static-site image; the Compose backend is deliberately run with Django's development server. `docs/walkthrough/deployment_observability.md` explicitly says Compose is for local development and demos.
- Nginx currently sends `/api/` to `http://backend:8000`. In Container Apps, internal app-name routing is available, but the exact upstream URL, target port, and health-probe behavior must be validated in a pilot. Keep browser calls same-origin and preserve `Path=/api/v1/auth/`, `HttpOnly`, `Secure`, and `SameSite=Strict` refresh-cookie semantics.
- M41 `.github/workflows/ci.yml` runs the backend, frontend, and mobile checks and builds both images on branch pushes; it does **not** publish to a registry or deploy. GitHub-hosted runners can run this pipeline while the developer laptop is off. A later Azure deploy workflow must be a separate, protected job and should use GitHub OIDC with narrowly scoped Azure RBAC rather than a long-lived service-principal secret.
- Current Django settings and architecture docs contain fixed Render/Vercel host and origin defaults. Before a pilot, set exact Azure/custom hostnames through environment configuration and verify `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `FRONTEND_URL`, forwarded-HTTPS handling, cookie attributes, and mobile API build configuration. Do not widen allowlists to platform wildcards.
- Flutter `AppConfig` uses build-time `API_BASE_URL` and otherwise defaults to emulator/loopback addresses. A production mobile build must receive a stable HTTPS API hostname; changing it after app distribution may require a new build unless the hostname itself remains stable.

### Database and release behavior

- Backend Docker image uses Python 3.12 and Gunicorn. PostgreSQL 15 is pinned in Compose and used by CI. The API config sets `CONN_MAX_AGE=60` and connection health checks.
- `backend/entrypoint.sh#L9-L13` runs `python manage.py migrate --noinput` whenever the launch command contains `runserver` or `gunicorn`. This is safe for the current one-backend local Compose topology but couples schema release work to every app-container start.
- Database settings in `backend/config/settings.py#L190-L196` call `socket.gethostbyname(db_host)` at import/startup and set that result as libpq `hostaddr`. PostgreSQL documents that when both `host` and `hostaddr` are supplied, `hostaddr` determines the network address. Azure Flexible Server documents that HA failover retains the endpoint hostname while updating its DNS record to the new primary address. This code therefore risks reconnecting to the old address until the app process restarts.
- No live source database, data volume, row count, extension inventory, current PostgreSQL version, RPO/RTO, or maintenance window was available. The destination version must be selected only after checking source compatibility and migration requirements. Azure Flexible Server supports community PostgreSQL and documents dump/restore and Azure Database Migration Service as migration paths.
- Repository rollback guidance says to deploy prior application code without reversing selected data/schema migrations; some existing migrations are not safely reversible. Migration rehearsal must use backup/restore and forward-compatible deployment practices, not assume reverse migration is a rollback.

### Identity, media, notifications, and operations

- **Secrets and identity:** production settings require SMTP credentials, Cloudinary credentials, and a Firebase service-account file. Use managed identity for Azure resource access (for example, Key Vault and ACR). External Cloudinary, Firebase, and SMTP credentials still need controlled secret storage unless their providers separately support a suitable federation flow. Do not bake credential files into images or Git.
- **Media:** `ResidentAwareCloudinaryStorage` keeps resident ID and billing uploads as authenticated assets, rejects public URL generation for these directories, and routes authorized access through application endpoints. Retain Cloudinary in the first Azure pilot and regression-test private access and barangay/resident authorization. Moving evidence to Azure Blob Storage is a separate data migration with its own inventory, privacy, and rollback plan.
- **Async notifications:** welcome/approval emails and FCM notifications run in daemon threads. The repository's deployment guide says they do not retry and may be interrupted by process restart. ADR 009 explicitly chose this low-dependency, best-effort model for the defended project scope. Do not silently add Celery or Redis. Before increasing replica counts, decide whether this delivery guarantee is acceptable or approve a separately designed durable Azure queue/worker.
- **Rate limits/cache:** the default Django cache is `LocMemCache`, while DRF `ScopedRateThrottle` uses it for login, registration, onboarding, and password reset. Each process has independent counters, including each Gunicorn worker. These limits are explicitly documented as basic request budgets, not brute-force/DoS security controls. If shared enforcement is required, decide on a shared limiter or gateway policy before scale-out; do not infer that Container Apps replica minimums make counters shared.
- **Health/logging:** `/api/v1/health/` checks PostgreSQL and cache read/write and returns 503 if either check fails. The backend Docker health check hits that path. Structured JSON logs go to stdout/stderr. A pilot should configure platform startup/readiness/liveness probes and Azure Monitor/Log Analytics ingestion and retention, then exercise DB failover and app restart. Existing health checks are not proof of live external SMTP, Firebase, Cloudinary, or reverse-proxy health.
- **Scheduled work:** the repository scan found no active Celery beat, cron package, or external scheduled-job configuration. Management commands exist for explicit maintenance/seeding tasks; do not create recurring Azure jobs without a requirement.

## Confirmed findings

### [FINDING-01] Schema migrations run on every API container start

- **Severity:** Medium
- **Confidence:** Confirmed behavior; concurrent rollout risk applies when more than one app instance starts against the same database.
- **Category:** Release operations
- **Location:** `backend/entrypoint.sh#L9-L13`; image default Gunicorn command at `backend/Dockerfile#L39-L43`.
- **Current behavior:** the shared image entrypoint runs `manage.py migrate` before starting either Gunicorn or `runserver`. If a platform starts multiple replicas or overlapping revisions, each container can attempt the same migration concurrently. This also makes application startup responsible for schema mutation.
- **Impact:** a concurrent/long-running schema change can make revisions start inconsistently or fail. It prevents a clear release gate that verifies migration completion before routing traffic.
- **Recommendation:** make the API container start the server only; run migrations as one explicitly serialized release/migration job before the application revision receives traffic. Keep local development convenience with a separate Compose one-shot migration service or an explicit documented command. Test empty database startup, upgrade from the previous schema, failed migration handling, and rollback behavior before cloud use.

### [FINDING-02] Database connections use a startup-time IP snapshot

- **Severity:** Medium
- **Confidence:** Confirmed behavior; outage impact is conditional on DNS target changes such as managed HA failover.
- **Category:** Database reliability
- **Location:** `backend/config/settings.py#L190-L196`.
- **Current behavior:** `socket.gethostbyname()` resolves `DATABASE_URL` host once during settings import; the numeric value is passed to libpq as `hostaddr`. PostgreSQL documents that `hostaddr` supplies the network address when both parameters are set. Azure Flexible Server HA keeps the endpoint name and updates DNS to the promoted primary.
- **Impact:** a process with the previous `hostaddr` may continue reconnecting to the pre-failover address instead of resolving the endpoint again. Container restarts may mask the condition but create avoidable recovery dependence on restart timing.
- **Recommendation:** remove the forced startup IP or make address-family behavior configurable without pinning the database target. Verify IPv4/IPv6 connectivity in the actual Azure VNet and simulate hostname target change/reconnect in a non-production test before enabling HA. Preserve TLS hostname verification.

### [FINDING-03] Throttle state is local to each Python process

- **Severity:** Low
- **Confidence:** Confirmed behavior.
- **Category:** Scaling / throttling
- **Location:** `backend/config/settings.py#L280-L293`, `#L373-L378`.
- **Current behavior:** DRF scoped throttles use the Django default cache, configured as `LocMemCache`. Gunicorn starts three workers by default, so requests routed to different workers/replicas do not share a counter.
- **Impact:** configured limits are approximate under multi-process or multi-replica load and may allow more requests than their configured rates. This is not presented as a security boundary in the code comments.
- **Recommendation:** record the acceptable behavior for the pilot. If these budgets must be consistent across replicas, add a separately reviewed shared enforcement mechanism and tests before increasing replicas. Do not treat `minReplicas=1` as a fix for per-process cache state.

### [FINDING-04] Best-effort daemon-thread notification work can be cut off at shutdown

- **Severity:** Medium
- **Confidence:** Confirmed and explicitly documented architecture trade-off.
- **Category:** Background work reliability
- **Location:** `backend/gridy_auth/tasks.py#L9-L26`; `backend/gridy_communications/tasks.py`; `architecture/decisions/009-simplification-to-defended-proposal-architecture.md#L14-L26`.
- **Current behavior:** calls start daemon threads and return; there is no durable broker, retry, or work record. The deployment guide documents that restart may interrupt delivery. ADR 009 accepted this for current notification volume and project constraints.
- **Impact:** a container stop, scale-down, revision replacement, or crash can lose a welcome email, password-setup notice, or FCM push. Container Apps scaling can scale an app to zero by default unless a minimum replica is configured, and scale-down terminates instances.
- **Recommendation:** choose and document whether these notifications are best effort for the pilot; include a restart/scale-down test. If delivery is required, design a small durable queue and worker separately, compare Azure-native queue options, preserve idempotency, and obtain approval before changing ADR 009. No Celery/Redis dependency is proposed here.

## Azure service comparison

| Option | Fit for this repository | Main trade-off |
| --- | --- | --- |
| **Azure Container Apps (recommended pilot)** | Runs the two existing Linux images with per-app internal/external ingress, app-name service discovery, revisions, traffic splits, and scaling. A frontend proxy can preserve relative `/api/v1` browser requests while the API is internal. | Requires explicit migration job, ingress/upstream configuration, health probes, secrets, and replica behavior. Consumption scaling can default to zero, which may add cold starts and can stop in-process work. |
| **Azure App Service for Containers** | Also hosts Linux custom containers and is a credible simpler alternative for a small number of web apps. It offers deployment slots and VNet integration/private endpoint patterns. | Networking and scaling are tied to App Service plan choices; it lacks Container Apps' same-environment service discovery and event-driven scaling model. Consider it if the team prefers App Service and has no need for Container Apps-specific behavior. |
| **Azure Static Web Apps + API** | Could host the static SPA with a bring-your-own API integration. | Bring-your-own API requires Standard; API routes use `/api`, each API request is limited to 45 seconds, network-isolated backends are unsupported, and BYO APIs do not attach to PR environments. This is a weaker fit if the Django API must stay private or requests can exceed the limit. |
| **Azure Kubernetes Service** | Technically capable of hosting the complete stack. | Adds cluster, ingress, policy, upgrade, and operational duties without a demonstrated workload need. Not recommended for this project at current scale. |

The ACA pairing is a **candidate design**, not a deployment contract. The pilot must prove the exact Nginx-to-internal-API path, custom-domain TLS, proxy headers, cookie issuance/refresh/logout, API access from mobile, and app/database network routing.

## Candidate Azure topology

```text
Browser / Mobile ── HTTPS/custom domain + /api/v1 ──> Frontend Container App (external ingress, Nginx)
                                          │ /api/v1 reverse proxy
                                          ▼
                               Django API Container App (internal ingress)
                                          │ private VNet + DNS
                                          ▼
                         Azure Database for PostgreSQL Flexible Server

GitHub Actions ── OIDC/RBAC ──> ACR ── managed identity pull ──> Container Apps
Container Apps ── managed identity ──> Key Vault (external provider secrets)
```

The web front end remains one browser origin. The preferred pilot routes mobile API traffic through the same stable public hostname and `/api/v1` path; this keeps the Django API internal while avoiding a separate mobile API origin. If pilot evidence shows that this proxy path is unsuitable for mobile traffic, evaluate a separately exposed API hostname with exact allowlists and TLS before changing the design. Keep the database private in either case.

### Region and data-location gate

As of the audit date, Microsoft's public region list has **no Philippines entry**; it lists Southeast Asia in Singapore and Malaysia West in Kuala Lumpur. The current PostgreSQL Flexible Server availability table shows new zone-redundant HA deployments temporarily blocked in Southeast Asia (while same-zone HA and geo-redundant backup are listed), and Malaysia West currently lists zone-redundant HA but no geo-redundant backup. Azure Container Apps availability and workload-profile features vary separately by region; the selected Container Apps plan, VNet/ingress features, database SKU, and quota must be checked together in Azure Products by Region and the target subscription before committing to a location. These are service-specific availability facts, not a legal or data-residency conclusion. Recheck actual subscription/region/SKU availability at pilot time. The LGU/data owner must choose acceptable data location, backup geography, latency, RPO/RTO, and legal/privacy requirements before a region is selected.

## Phased migration plan and go/no-go gates

### Phase 0 — Business and account prerequisites

1. Identify the Azure subscription owner, billing agreement, required resource governance, support plan, and budget ceiling.
2. Obtain workload facts: daily/peak traffic, database size and growth, file volume, current Cloudinary usage, mobile release cadence, retention, backup needs, acceptable downtime, RPO/RTO, and notification delivery expectations.
3. Obtain LGU/data-owner sign-off for permitted regions, backups, cross-region recovery, and sensitive resident evidence handling.
4. Create a calculator estimate with the actual region and SKU candidates. Include Container Apps minimum replicas/CPU/RAM/idle hours, PostgreSQL compute/storage/HA/backup retention, ACR, logs ingestion and retention, outbound data, Key Vault, DNS/custom domain, and support plan. Compare it with current provider bills. No monthly amount can be supported without these inputs.

**No-go:** no named budget owner, no data-location decision, no agreed RPO/RTO, or no evidence that Azure provides a material organizational or operational benefit.

### Phase 1 — Application release-readiness changes

1. Separate schema migration execution from API startup and implement a serialized one-off migration path.
2. Remove startup-time `hostaddr` pinning; verify hostname-based connection and TLS behavior.
3. Decide whether daemon-thread notification loss is acceptable; if not, approve a separately scoped durable-work design.
4. Decide whether throttle counters need shared enforcement for multi-replica deployments.
5. Separate liveness/readiness concerns if health-checking the database causes the API to be restarted during a database outage; define the intended probe semantics.

**Gate:** local/CI tests prove migration execution exactly once, failed migration blocks release, old/new schema compatibility, database reconnect after DNS change, private media authorization, and same-origin auth cookies.

### Phase 2 — Non-production Azure foundation and parity pilot

1. After region and network decisions, define a small, reproducible Azure landing zone (resource groups, naming/tags, least-privilege RBAC, VNet/subnets/private DNS, logs, ACR, Key Vault). Use reviewed IaC; no portal-only undocumented production state.
2. Deploy exact commit-SHA-tagged images to ACA; use managed identity for ACR pulls and Key Vault reads. Set API internal ingress and frontend external ingress or an equivalent reviewed same-origin path.
3. Configure startup/readiness/liveness probes, minimum replica policy, resource limits, scale limits, revision policy, retention, alerts, and operational runbooks.
4. Leave Cloudinary, Firebase, and SMTP unchanged; verify secret handling and provider egress from the chosen VNet.
5. Verify web login, token refresh, logout, CSRF/origin handling, staff/resident RBAC, tenant boundaries, private evidence access, email/FCM behavior, health endpoints, and mobile build against a stable API hostname.

**Gate:** no internet-accessible database, no public resident evidence, no wildcard trusted origins, no credentials baked into images/workflows, and all required functional/security/recovery checks pass.

### Phase 3 — Database migration rehearsal

1. Inventory source database extensions, collation/time zone, encoding, size, roles, sequences, constraints, indexes, and active migration state.
2. Test a production-like sanitized clone in a non-production Azure DB; select dump/restore for a planned outage or Azure Database Migration Service only if measured downtime requirements justify its additional setup.
3. Compare row counts and domain invariants, tenant isolation, audit records, payment/receipt integrity, media references, and query behavior. Measure migration and rollback windows.
4. Prove encrypted backup creation and actual restore to an isolated database. Record RPO and RTO from the rehearsal rather than estimating them.

**Gate:** business owner signs off on checksums/counts, application smoke tests, backup restore, data freeze/catch-up approach, and a rollback that does not require reverse migrations.

### Phase 4 — Staged traffic and mobile transition

1. Add an exact custom API hostname and configure DNS/TLS and allowlists. Prefer a stable API domain so mobile builds do not need an emergency URL change.
2. Lower DNS TTL before cutover if the DNS owner permits; document the actual provider behavior.
3. Run a non-production/canary rollout and test both web and mobile from real networks. Confirm forwarded scheme/host, cookie path/SameSite/Secure flags, `FRONTEND_URL`, static assets, long requests, and payment/receipt flows.
4. For production, choose either a bounded write freeze plus final sync or a separately engineered dual-run/catch-up strategy. Do not let two databases accept uncontrolled writes.
5. Keep Render/Vercel and the old database recoverable during the agreed rollback window. Route traffic back only under a documented decision; never silently discard writes accepted by the new DB.

**Gate:** explicit release approval, tested recovery, staffed monitoring window, successful canary metrics, and rollback owner on call.

### Phase 5 — Stabilization and decommission

1. Reconcile records and provider delivery after cutover; monitor errors, latency, DB saturation, throttles, logs volume, and storage egress.
2. Retain the old system read-only for the agreed period, then decommission only after data-owner sign-off and backup-retention requirements are satisfied.
3. Update architecture/runbooks, incident contacts, cost alerts, and owner access reviews.

## Cost estimate inputs (required before quote)

- Region and whether the environment/database use private networking.
- API and frontend CPU/RAM, minimum replicas, peak concurrency, requests per month, hours active, and scale-to-zero policy.
- PostgreSQL storage, IOPS/performance tier, connection count, HA mode, backup redundancy/retention, and expected growth.
- Container registry image sizes, retained image count, and pull/build frequency.
- Log Analytics ingestion GB/day and retention, alerting, tracing, and any Sentry usage.
- Egress including image/file delivery and mobile/web traffic; Cloudinary/Firebase/SMTP usage that remains billed outside Azure.
- Custom domain/DNS and optional edge routing, support plan, subscription discounts/credits, and currency/tax treatment.

Use Microsoft's pricing calculator with account-specific negotiated prices when available; a retail-only estimate may differ from the actual agreement.

## Verification and limitations

- Repository evidence was inspected at the paths and line anchors shown above.
- Official Azure/PostgreSQL documentation was consulted on 2026-10-11; sources below are current-reference pages and must be rechecked before provisioning.
- No Azure CLI, Azure subscription, Render/Vercel runtime, production database, external provider account, or DNS zone was accessed.
- No application tests or cloud deployment tests were run because this milestone changes documentation only.
- Hindsight search/list/capture could not connect to the local service at `127.0.0.1:9077`; no memory claims were used.
- Worktree diff hygiene and exact changed-path scope are recorded in the task `STATUS.md`.

## Official references

Accessed 2026-10-11:

1. [Azure Container Apps ingress](https://learn.microsoft.com/en-us/azure/container-apps/ingress) — external/internal ingress and app visibility.
2. [Communicate between Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/connect-apps) — service discovery, app-name routing, internal network behavior, and revisions.
3. [Azure Container Apps scaling](https://learn.microsoft.com/en-us/azure/container-apps/scale-app) — replica minimums and default scale-to-zero behavior.
4. [Azure Static Web Apps API constraints](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-overview) — BYO API plan, route, request-duration, and networking limits.
5. [Azure container service selection](https://learn.microsoft.com/en-us/azure/architecture/guide/container-service-general-considerations) — Container Apps, App Service containers, and AKS operational/networking trade-offs.
6. [Azure Database for PostgreSQL Flexible Server overview](https://learn.microsoft.com/en-us/azure/postgresql/overview) — managed PostgreSQL, region availability, backups, and migration options.
7. [Azure PostgreSQL private networking](https://learn.microsoft.com/en-us/azure/postgresql/network/concepts-networking-private) — VNet-injected private access and DNS requirements.
8. [Azure PostgreSQL high availability](https://learn.microsoft.com/en-us/azure/postgresql/high-availability/concepts-high-availability) — DNS endpoint update and reconnection behavior during failover.
9. [Azure Container Apps Key Vault secrets](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets) — managed identity and Key Vault role requirements.
10. [GitHub Actions deployment to Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/github-actions) — container build/deploy and managed identity for ACR pulls.
11. [GitHub Actions OIDC to Azure](https://learn.microsoft.com/en-us/azure/azure-functions/functions-how-to-github-actions) — federated identity pattern and minimal workflow permissions; the page demonstrates Azure Functions, so apply the authentication pattern to ACA only after validating the deploy action.
12. [Azure public region list](https://learn.microsoft.com/en-us/azure/reliability/regions-list) — physical locations, region pairs, and availability zones.
13. [Azure Pricing Calculator](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/pricing-calculator) — cost estimation based on selected region, configuration, and usage inputs.
14. [PostgreSQL libpq connection parameters](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-PARAMKEYWORDS) — `hostaddr` numeric IP behavior when `host` and `hostaddr` are both supplied.
15. [Azure Products by Region](https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/?products=container-apps) — validate service availability for a selected region and plan.
16. [Azure Container Apps workload profiles](https://learn.microsoft.com/en-us/azure/container-apps/workload-profiles-overview) — workload-profile capability and region availability vary.
