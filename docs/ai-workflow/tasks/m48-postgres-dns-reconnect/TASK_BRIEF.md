# M48 — PostgreSQL DNS Reconnect CI Smoke

## 1. Metadata

- **Task ID:** m48-postgres-dns-reconnect
- **Task type:** Reliability test / CI
- **Target components:** Backend test harness, CI smoke scripts, deployment documentation
- **Lead, implementer, reviewer:** Codex (user-directed sole-agent mode)
- **Branch:** test/m48-postgres-dns-reconnect
- **Base:** M47 local checkpoint 29f04cc702003bdbec1d2c17a55471c26fc560a9, tree dab1c9920e11c3894d1a52a8f4eb50b21b83b094; equivalent remote M47 PR #178 tree.

## 2. Objective and Scope

Add an isolated GitHub Actions smoke test showing that one long-lived Django process can open a new PostgreSQL connection through a hostname after its original database connection is interrupted and the Docker DNS alias is moved to a second disposable database container.

### In scope

- Add a test-only HTTP probe that uses Django's configured database wrapper in one persistent process.
- Add a Compose definition and guarded smoke script with two disposable PostgreSQL containers at distinct fixed IPs; move the db alias after breaking the original connection and verify a later probe reaches the new address.
- Run the smoke as a dedicated CI job and record the distinction between this Docker DNS test and real Azure/provider DNS failover.
- Update deployment documentation with the test's scope and remaining live-provider verification gate.

### Non-goals

- Do not change application request behavior, database settings, Django models, or migrations.
- Do not add dependencies, brokers, cache services, or runtime retry logic.
- Do not use or modify persistent Compose volumes, local environment files, deployed databases, Azure/Render accounts, secrets, or production infrastructure.
- Do not claim this test proves provider failover, managed database availability, TLS, private DNS, or automatic retry of a failed HTTP request.

## 3. Current Behavior and Evidence

- M43 removed settings-time hostname resolution and hostaddr pinning while retaining Django connection lifetime and health checks.
- M44's isolated Compose smoke proves successful migrations gate backend startup and failed migrations prevent backend startup.
- M47 / ADR 014 explicitly says neither result proves reconnect after a live database DNS change; that remains an Azure pilot gate.
- M44 could not use the local Docker daemon because access to /var/run/docker.sock was denied. The real container exercise therefore belongs in a dedicated GitHub-hosted runner job, with local static/config checks where possible.

## 4. Required Rules

- Use unique Compose project/network names, no fixed container_name, no published host ports, and ephemeral database storage only.
- Do not touch the repository's root .env or backend/.env; this smoke must not require creating either file.
- Keep one Django probe server process alive across the database switch. A fresh process for each connection would not verify same-process reconnection behavior.
- Do not report a successful retry of the failed HTTP request. The acceptance behavior is: the active connection is interrupted, one probe reports unavailable and closes the unusable Django connection, and a subsequent probe reconnects to the new DNS target.
- Keep CI permissions at repository read-only and preserve the all-branches PR trigger.
- Label credentials as disposable test-only values and avoid printing database URLs or exception details.

## 5. Observable Acceptance Criteria

1. [ ] The smoke starts two isolated PostgreSQL containers on different IPs and one persistent Django probe process, with no database volume or host port publication.
2. [ ] The first probe returns the primary database address from inet_server_addr().
3. [ ] After the primary is terminated and detached from the test network, the db alias is assigned to the failover container; the active probe returns HTTP 503 once, then the next probe succeeds from the failover container's distinct IP.
4. [ ] The smoke script uses unique project names, refuses unsafe repository environment-file collisions if relevant, and cleans only its project containers/networks on success or failure.
5. [ ] CI runs the smoke on branch and PR pushes without adding write permissions or new package dependencies.
6. [ ] Documentation says this validates disposable Docker DNS plus Django reconnection only; actual provider DNS failover and production readiness remain unverified.
7. [ ] No schema, production behavior, dependency, persistent data, or cloud infrastructure changes are introduced; actual checks and limitations are recorded in STATUS.md.

## 6. Relevant Files

- .github/workflows/ci.yml
- backend/tests/postgres_dns_reconnect_probe.py (test-only server/client harness)
- scripts/ci/postgres-dns-reconnect.compose.yml (new disposable stack)
- scripts/ci/postgres-dns-reconnect-smoke.sh (new smoke runner)
- architecture/11-deployment-and-ci-cd.md
- architecture/decisions/014-safe-schema-rollout-compatibility.md (read-only contract)
- docs/ai-workflow/tasks/m47-schema-rollout-compatibility/STATUS.md (read-only baseline)

## 7. Risks and Mitigations

- **Risk:** The first post-failover request is mistaken for a transparent retry. **Mitigation:** test and document the expected single 503 followed by recovery on a later request.
- **Risk:** The test alias maps to the same database IP or the old alias remains resolvable. **Mitigation:** reserve distinct static IPs, detach the primary endpoint, and assert the returned server address changes.
- **Risk:** Cleanup affects a developer's Compose stack. **Mitigation:** unique project name, no fixed names/ports/volumes, no environment-file writes, and cleanup scoped to the test project.
- **Residual risk:** Docker's embedded DNS test does not model Azure PostgreSQL DNS, TLS, existing connection draining, or provider failover timing. Preserve the non-production provider rehearsal gate.
