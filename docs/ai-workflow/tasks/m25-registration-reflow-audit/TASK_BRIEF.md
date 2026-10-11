# Task Brief: Registration Reflow Accessibility Audit

## 1. Metadata
- **Task ID:** `m25-registration-reflow-audit`
- **Task Type:** Read-only accessibility audit
- **Target:** Public registration page at narrow responsive widths
- **Lead / Reviewer:** Codex (user-directed sole-agent mode)
- **Branch / Base:** `audit/registration-reflow-320css` / M24 checkpoint `a8d194e`

## 2. Objective and Scope
- **Goal:** Audit the registration page for horizontal overflow, clipped controls, and lost content at 320 CSS pixels, the WCAG 1.4.10 Reflow width corresponding to a 1280 CSS-pixel desktop viewport at 400% zoom.
- **Context:** M20 inspected the desktop registration page but did not test 200%/400% zoom or a mobile viewport.
- **Non-goals:** No application code/style changes, form entry, file selection, registration submission, backend changes, full WCAG certification, or screen-reader/device certification.

## 3. Observable Acceptance Criteria
1. [x] Local `/register` renders in Chrome at 320 CSS pixels and a desktop reference width.
2. [x] Record viewport/document widths and identify any horizontal scrolling, clipped content, or controls extending beyond the viewport.
3. [x] Inspect the layout and visible controls at 320 CSS pixels using a local screenshot and DOM/accessibility-tree evidence.
4. [x] Record actual browser/runtime/network health and confirm no form data, file selection, or submission occurred.
5. [x] Classify confirmed defects separately from suggestions; checkpoint only M25 brief/plan/report.

## 4. Constraints and Limits
- Follow `docs/ai-workflow/playbooks/AUDIT.md`; do not modify application source, styles, configuration, or data.
- Use local Vite and isolated headless Chrome only.
- A 320 CSS-pixel viewport checks the WCAG reflow width. It is a proxy for 400% zoom from a 1280-pixel viewport, not a claim that Chrome's browser UI zoom control was exercised.
- Preserve unrelated untracked `.agents/`, `.codex/`, logo assets, and task/environment files.
