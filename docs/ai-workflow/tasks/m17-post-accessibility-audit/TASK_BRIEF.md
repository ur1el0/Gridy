# Task Brief: Post-Remediation Accessibility Audit

## 1. Metadata
- **Task ID:** `m17-post-accessibility-audit`
- **Task Type:** Read-only accessibility audit
- **Target Components:** React web and Flutter mobile
- **Lead / Auditor:** Codex (temporary user-directed single-agent mode)
- **Branch:** `audit/post-accessibility-remediation`
- **Base Commit:** `9a1b8a7` (M16 mobile accessibility checkpoint)

## 2. Objective & Scope
- **Goal:** Independently verify the M15 web and M16 mobile remediations against the four findings in the M14 accessibility baseline, and report remaining risks and verification gaps.
- **Non-goals:** No application source, test, dependency, configuration, or data changes; no deployment, production URL interaction, authentication with real user credentials, or physical device certification.
- **Context:** M15 addressed web upload labels/keyboard access and modal semantics/focus management. M16 addressed mobile field semantics, hint/navigation contrast, and selected navigation state. M14's runtime checks were limited because browser access had failed then; browser QA tools are now available for a local read-only inspection.

## 3. Current Behavior & Evidence
- Baseline findings and limitations: `docs/ai-workflow/tasks/m14-accessibility-audit/AUDIT.md`.
- M15 source/test changes and checks: `docs/ai-workflow/tasks/m15-web-accessibility/{TASK_BRIEF.md,PLAN.md,STATUS.md}`.
- M16 source/test changes and checks: `docs/ai-workflow/tasks/m16-mobile-accessibility/{TASK_BRIEF.md,PLAN.md,STATUS.md}`.
- M15 checkpoint: `2b2c365`; M16 checkpoint: `9a1b8a7`.

## 4. Audit Rules
- Follow `docs/ai-workflow/playbooks/AUDIT.md` and `.agents/skills/browser-qa/SKILL.md`.
- Treat local runtime checks as read-only. Do not exercise production endpoints, mutate application data, or use real credentials.
- Separate confirmed defects from suggestions and manual verification gaps. Automated checks do not establish full WCAG conformance.
- Keep physical TalkBack/VoiceOver behavior explicitly unverified unless a device is available and used.

## 5. Observable Acceptance Criteria
1. [ ] Review M15's upload labels, focusability, visible focus styling, and residency select associations against source and regression tests.
2. [ ] Review all three M15 dialogs for role/name/modal semantics and focus entry, wrapping, Escape, and restoration coverage.
3. [ ] Review M16 field labels and navigation state/action semantics against Flutter source and widget tests.
4. [ ] Verify declared mobile text contrast ratios against each relevant background and record calculations.
5. [ ] Attempt browser-level checks on a local build: console/network health, keyboard path, dialog focus behavior where reachable, and an automated accessibility scan if supported. Record actual output and limitations.
6. [ ] Deliver `AUDIT.md` with finding severity/confidence, evidence, verified criteria, unresolved risks, and clear next actions; make no application changes.
7. [ ] Stage and locally checkpoint only M17 audit packet files; preserve every pre-existing untracked environment file.

## 6. Relevant Files & Affected Areas
- Baseline: `docs/ai-workflow/tasks/m14-accessibility-audit/AUDIT.md`
- Web: `frontend/src/components/ui/FileUploadZone.tsx`, `frontend/src/components/auth/register/ResidentVerificationUploads.tsx`, three M15 modal components, `frontend/src/hooks/useModalFocus.ts`, scoped tests.
- Mobile: `mobile/lib/widgets/custom_text_field.dart`, `mobile/lib/widgets/custom_bottom_nav.dart`, `mobile/lib/core/theme/app_colors.dart`, `mobile/test/accessibility_widgets_test.dart`.
- Deliverables: `docs/ai-workflow/tasks/m17-post-accessibility-audit/{TASK_BRIEF.md,PLAN.md,AUDIT.md,STATUS.md}`.

## 7. Constraints & Known Risks
- Browser bridge availability and route authentication may limit actual modal journeys; do not work around that by creating or altering application accounts/data.
- No committed screenshot baseline exists for visual regression; screenshots can document appearance but cannot support pixel-diff acceptance.
- `.agents/`, `.codex/`, existing local task files, and supplied logo JPEGs are pre-existing untracked content and must remain untouched and unstaged.
