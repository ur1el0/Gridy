# Plan: Web and Mobile Accessibility Baseline Audit

> **Work contract:** Read-only audit. No app, test, config, or dependency edits. Complete the audit, save evidence, checkpoint only its task documents, then continue to the highest-priority remediation on a new branch.

## Milestone 1: Audit the Current Accessibility Baseline

1. Inspect shared React controls, layouts, forms, tables, and dialogs, then review critical web journeys for semantic names, keyboard order/focus, errors, status announcements, and visible focus.
2. Inspect Flutter shared controls and representative auth, registration, document, queue, and official journeys for labels, semantics, focus/order, target size, contrast, and dynamic state announcements.
3. Run existing frontend lint and full tests. Run Dart analysis and Flutter tests if the SDK is available without installing dependencies or changing repository files.
4. Separate confirmed source defects from visual/device checks that static inspection cannot verify. Record concrete references and coverage limitations in `AUDIT.md`.
5. Verify no tracked source diff, no staged paths before the scoped documentation checkpoint, and clean whitespace.

## Validation

```bash
npm --prefix frontend run lint
npm --prefix frontend run test
cd mobile && /home/dokja/development/flutter/bin/dart analyze
cd mobile && /home/dokja/development/flutter/bin/flutter test
git diff --check
git diff --cached --name-only
```

Skip a mobile command only if its executable is unavailable, and record the exact reason. Do not install an SDK or modify project dependencies for this audit.

## Completion Gate

- `AUDIT.md` records scope, concrete findings, severity, WCAG mappings, unverified checks, and next work.
- Actual command results and branch/checkpoint are recorded in local ignored `STATUS.md`.
- No app/test/configuration changes are present. Only this audit's brief, plan, and report may be committed.
