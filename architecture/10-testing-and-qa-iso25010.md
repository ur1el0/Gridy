# Testing and Quality Assurance

The repository uses focused Django/pytest and Django test-runner suites, React/Vitest tests, and Flutter tests. Exact totals change as features evolve, so this page records the verification approach rather than a static pass count.

## Verification by layer

- **Backend:** unit and API tests for serializers, permissions, tenant isolation, state transitions, private media, audit behavior, and migrations. Run Django system and migration checks where appropriate. PostgreSQL-backed throttle concurrency must be tested against PostgreSQL; SQLite does not provide the row-lock semantics needed to validate it.
- **Web:** Vitest component/API tests, linting, and a production TypeScript/Vite build. Add browser-level checks for complex focus, modal, and responsive behavior when the task calls for them.
- **Mobile:** Flutter unit/widget tests and `flutter analyze`; use a device or emulator for platform-specific behavior when available.
- **Cross-layer:** verify API schema generation, contract parity, authenticated flows, and boundary behavior across web/mobile clients.
- **Documentation-only:** run `git diff --check` and the documentation governance audit; application test suites are not needed unless code is changed.

## Security-focused test expectations

Tests for sensitive workflows should cover allowed and denied roles, same-tenant and cross-tenant records, unauthenticated requests, missing objects, lifecycle edge cases, and storage/provider failure paths. Avoid relying only on UI hiding; assert backend behavior directly. Tests that touch external services should use safe mocks or local test configuration and should not contact production infrastructure.

## Quality model

Use ISO/IEC 25010 as a review lens for functional suitability, reliability, performance efficiency, usability, security, compatibility, maintainability, and portability. This is an evaluation framework; a passing test suite alone does not certify the system against the standard.

## Reporting results

Record the exact command, environment where relevant, and actual output in the active task's `STATUS.md`. Do not carry forward old test counts or claim hosted checks, deployments, external delivery, or browser verification unless they were observed for that revision. See the [System Verification Playbook](../docs/walkthrough/system_verification_playbook.md).
