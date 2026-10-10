# Task Brief: Registration Form Accessibility Sweep

## 1. Metadata
- **Task ID:** `m20-registration-form-accessibility-sweep`
- **Task Type:** Read-only accessibility audit
- **Target Component:** React resident and official registration form
- **Auditor:** Codex (user-directed single-agent mode)
- **Branch / Base:** `audit/registration-form-accessibility-sweep` / M19 checkpoint `cb4de51`

## 2. Objective and Scope
- **Goal:** Inspect all controls exposed by the local registration page in resident and official modes for accessible names and keyboard operation, and record any concrete defects.
- **Non-goals:** No application source, test, dependency, configuration, or data edits; no account creation, registration submission, file upload, production access, deployment, or push.
- **Context:** M17 was a focused recheck of prior findings and found an unnamed barangay selector. M18 fixed the label and M19 confirmed the fix in Chrome. The prior audits did not claim a complete registration-page accessibility audit.

## 3. Audit Method
- Use local Vite and isolated headless Chrome/CDP only.
- Inspect resident registration controls, expand the verification disclosure without selecting files, and switch to official registration mode if source confirms it is a local UI toggle.
- Capture accessible roles/names, required/disabled state, keyboard focus visibility, console exceptions, and local request failures.
- Do not fill inputs, choose files, activate submit, or invoke registration endpoints.

## 4. Acceptance Criteria
1. [x] Every visible interactive control in the inspected resident registration states is accounted for by role, accessible name, and required/disabled state where applicable.
2. [x] Verification upload controls have meaningful names and remain keyboard reachable when exposed.
3. [x] Official registration mode's visible controls are inspected through a safe local mode toggle.
4. [x] The missing required state is recorded with source/runtime evidence and severity; passing checks are not presented as certification.
5. [x] The audit report states device/screen-reader, viewport, automated-scan, keyboard-activation, and form-submission limits.
6. [x] Only the M20 brief, plan, and audit report are included in the local checkpoint; unrelated untracked files remain untouched.

## 5. Constraints
- Follow `docs/ai-workflow/playbooks/AUDIT.md` and `.agents/skills/browser-qa/SKILL.md`.
- Use local routes and public read-only data only. Never enter personal data or submit the form.
- Save temporary screenshots/logs only under `/tmp`.
- Preserve `.agents/`, `.codex/`, supplied brand assets, and unrelated task/environment files.
