# Plan: Post-Merge Review Remediations

## Milestone 1 — M85 fee lifecycle and eligibility
- Add API regressions first for status-only waiver bypass, unsupported RA 11261 document type, and walk-in eligibility.
- Make assessment status read-only to serializer persistence; continue deriving ASSESSED/WAIVED from fee and reason inputs.
- Restrict RA 11261 to linked resident Barangay Clearance requests and require nonblank staff verification rationale.
- Run fee assessment and document/payment regression suites.

## Milestone 2 — M79 honest queue estimate
- Add unit/widget regressions for missing/zero average wait.
- Represent an unavailable estimate honestly in the model and metric card.
- Run queue tests, then the full Flutter suite and analyzer.

## Milestone 3 — M87 provider source defense
- Add tests showing injected hotline names/office-contact text are omitted while normal hotlines remain available.
- Apply injection-only screening to all free-text provider-bound contact fields so legitimate public phone numbers remain.
- Run targeted navigator tests and backend communications tests.

## Milestone 4 — M88 lightweight UI integration
- Apply the already-approved native Material 3 M88 patch to current main, preserving M79 behavior and excluding the overlapping M86 redesign.
- Run Flutter tests/analyzer and inspect dependency diffs.
- Attempt Redmi 12C verification; record device/TalkBack access limits honestly.

## Milestone 5 — Cross-layer verification and handoff
- Run backend targeted suites, frontend tests/build if affected, full Flutter suite/analyzer, Django checks, migration dry-run, and `git diff --check`.
- Update STATUS.md with actual outputs and remaining blocked gates.
- Keep M5 incomplete and AC-18 disabled until their external acceptance evidence exists.

## Risks
- Current main may expose behavior not present on the old local branch; all edits are isolated in a worktree based on fetched `origin/main`.
- Provider evaluation and blind human scoring are not code changes and cannot be marked complete here.

## Plan amendment 1 — Preserve M87 entry during M88 integration
The M88 cherry-pick conflicts in `mobile/lib/widgets/quick_services_section.dart` because the old M88 base predates the Ask Barangay quick-service action now on main. Resolve the conflict by retaining the M87 action/navigation and applying the M88 visual styling around it. No service contract or navigation behavior will change.
