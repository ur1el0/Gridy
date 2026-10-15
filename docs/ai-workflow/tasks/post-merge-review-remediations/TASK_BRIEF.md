# Task Brief: Post-Merge Review Remediations

## Goal
Fix the confirmed M85 fee assessment bypasses, remove the M79 fabricated queue estimate, screen all M87 provider-bound local text for prompt injection, and integrate the approved lightweight M88 Material 3 resident UI into a branch based on current main.

## Scope
- Backend document fee assessment API, eligibility policy, regression tests.
- Flutter queue estimate model/widget/tests.
- Navigator prompt-source filtering/tests.
- M88 lightweight Material 3 changes from `feat/mobile-ui-refresh-lightweight`, preserving current-main M79 behavior and adding no runtime dependencies.
- Update this task's status with real verification results.

## Non-goals
- Do not enable `PUBLIC_NAVIGATOR_ENABLED`.
- Do not enable Facebook publishing; AC-18 remains BLOCKED / NO-GO.
- Do not claim M5 complete without a full answer corpus and blind human scoring.
- Do not import the overlapping broad M86 redesign branch.
- Do not modify the user's dirty primary checkout or production systems.

## Acceptance criteria
1. Review API cannot set assessment state directly. A status-only WAIVED/ASSESSED payload cannot bypass written justification, attribution, audit logging, or the readiness gate.
2. RA 11261 can be granted only for Barangay Clearance to a linked resident, at most once, with explicit staff justification; unsupported document types and walk-ins are rejected.
3. The queue does not display a computed call time when the server has no positive average-wait value.
4. Hotline names and Barangay office-contact text containing source-injection phrases are excluded from the AI prompt bundle without dropping valid phone contacts.
5. Lightweight Material 3 UI is integrated with no new package/lockfile changes and preserves M79 loading/error states.
6. Targeted regressions, full affected test suites, analyzers, system checks, and diff hygiene are run and recorded. Physical TalkBack is attempted only if the device is accessible from this environment; otherwise record it as unverified.
