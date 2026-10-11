# Audit Plan: Post-Remediation Accessibility

## 1. Plan Overview
- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target Branch:** `audit/post-accessibility-remediation`
- **Base:** `9a1b8a7`
- **Complexity:** Medium
- **Mode:** Read-only source/test/runtime review. Only the audit packet may be written.

## 2. Milestone Breakdown

### Milestone 1: Verify M15/M16 Against M14 Findings
- **Objective:** Establish whether code and regression coverage address each previously recorded accessibility finding.
- **Actions:**
  1. Inspect the M15 upload, select, modal, and focus-management source plus focused tests.
  2. Inspect M16 shared field/nav semantics, color tokens, and widget tests.
  3. Recalculate token contrast with the actual M14 backgrounds.
  4. Run frontend lint, focused accessibility tests, full frontend tests, production build, and mobile analyzer/tests as read-only checks if the local toolchains permit.
  5. Attempt local browser checks with Chrome DevTools; inspect console/network, registration upload keyboard focus, and accessible tree. Exercise a modal only if it is safely reachable without real credentials or data mutation. Run Lighthouse accessibility scan or equivalent where available.
  6. Record each result and limitation in `AUDIT.md` and `STATUS.md`.
- **Validation commands:**
  ```bash
  npm --prefix frontend run lint
  npm --prefix frontend run test -- src/components/ui/FileUploadZone.test.tsx src/components/auth/register/ResidentVerificationUploads.test.tsx src/hooks/useModalFocus.test.tsx src/components/accessibility/AccessibleDialogs.test.tsx
  npm --prefix frontend run test
  npm --prefix frontend run build
  (cd mobile && /home/dokja/development/flutter/bin/dart analyze)
  (cd mobile && /home/dokja/development/flutter/bin/flutter test)
  git diff --check
  ```
- **Expected outcome:** Every M14 finding is classified as verified fixed, partially verified, unresolved, or unverified with direct evidence. No application files change.

## 3. Audit Deliverable Review
- [x] Finding statuses reference source, tests, runtime evidence, or an explicit verification limitation.
- [x] Browser and automated tool results are reported without overclaiming conformance.
- [x] Findings, suggestions, and manual checks are separated.
- [x] `AUDIT.md` includes counts and an actionable next milestone recommendation.
- [x] Only the M17 brief, plan, and audit report are staged; ignored local `STATUS.md` is updated locally.

## 4. Risks & Rollback
- **Risks:** Browser MCP may be unavailable or the local app may require credentials. A green Lighthouse or axe scan covers only part of accessibility and does not replace keyboard/screen-reader review.
- **Rollback:** If the audit packet contains errors, amend only M17 documentation. No application rollback is expected because this milestone does not change application files.

## 5. Decisions
- Reuse M14 as the fixed baseline and check only the remediations and open verification gaps in its findings.
- Do not expand this into a general full-app WCAG certification or change unrelated screens.
