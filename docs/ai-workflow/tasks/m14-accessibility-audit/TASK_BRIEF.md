# Task Brief: Web and Mobile Accessibility Baseline Audit

## 1. Metadata

- **Task ID:** `m14-accessibility-audit`
- **Type:** Read-only accessibility audit
- **Branch:** `audit/frontend-accessibility`
- **Owner:** Codex (user-directed sole-agent mode)

## 2. Goal and Scope

Establish an evidence-based accessibility baseline for the React web and Flutter mobile clients against the repository's WCAG 2.2 AA objective. Review shared controls and critical journeys, including sign-in/registration, resident document and queue actions, official workflows, dialogs, and dynamic status/error feedback. Record confirmed defects separately from risks and suggestions.

No application, test, configuration, or dependency source may be changed in this audit. The result is a report and a prioritized remediation plan for a separate implementation branch.

## 3. Rules and Constraints

- Prefer native semantic controls and labels; verify keyboard and screen-reader names, roles, state, and focus behavior.
- Review contrast, focus visibility, target size, zoom/reflow, error associations, modal focus, and dynamic announcements where the source permits reliable assessment.
- Do not call the application compliant solely from static inspection or automated tests. Mark visual/runtime criteria unverified when no rendered browser/device evidence is available.
- Do not add accessibility dependencies or run production actions.
- Preserve existing untracked agent/environment content and logo assets; stage only this task's audit documents if checkpointed.

## 4. Acceptance Criteria

1. [x] Audit scope and inspection method are recorded.
2. [x] Findings cite repository paths and exact line numbers, state the relevant WCAG 2.2 criterion when applicable, and distinguish confirmed defects from unverified risks/suggestions.
3. [x] Web and mobile critical journeys/shared components are represented; coverage gaps are explicit.
4. [x] Existing frontend and available mobile static/test checks are run and actual results recorded.
5. [x] No app/test/configuration source changed, no unrelated path is staged, and agent/environment assets remain untouched.
6. [x] A focused next remediation milestone is recommended, ordered by user impact and severity.
