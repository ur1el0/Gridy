# Task Brief: Mobile Accessibility Remediation

## 1. Metadata
- **Task ID:** `m16-mobile-accessibility`
- **Task Type:** Accessibility remediation
- **Target Component:** Mobile (Flutter)
- **Lead / Implementer / Reviewer:** Codex (temporary user-directed single-agent mode)
- **Branch:** `fix/mobile-accessibility`
- **Base Commit:** `2b2c365` (`fix(web): improve registration and modal accessibility`)

## 2. Objective & Scope
- **Goal:** Remediate the confirmed mobile field-label and text-contrast accessibility findings from the M14 audit, and expose bottom-navigation selection to assistive technology.
- **Non-goals:** No web changes, broad visual redesign, unrelated Flutter cleanup, backend/API changes, dependency changes, physical-device certification, deployment, push, or production work.
- **Context:** The M14 source audit found `CustomTextField` renders its label as a sibling with no field association, `AppColors.textHint` is too light on input surfaces, and inactive bottom-navigation labels are too light and do not declare selected state.

## 3. Current Behavior & Evidence
- `mobile/lib/widgets/custom_text_field.dart` renders `label.toUpperCase()` in a separate `Text` and gives `TextFormField` only a hint; the field has no programmatic label.
- `mobile/lib/core/theme/app_colors.dart` sets `textHint` to `#94A3B8` and `inputBackground` to `#E2E8F0`; the audited ratio is 2.08:1.
- `mobile/lib/widgets/custom_bottom_nav.dart` uses `#94A3B8` for inactive labels and icons on white; the audited text ratio is 2.56:1. `_NavItem` has no explicit selected semantics.
- The detailed baseline is `docs/ai-workflow/tasks/m14-accessibility-audit/AUDIT.md`, findings A11Y-02 and A11Y-04.

## 4. Required Business & Architectural Rules
- No tenant, RBAC, session, treasury, database, or background-task behavior is in scope.
- Preserve existing field editing, validation, hints, tap behavior, navigation callbacks, and visible label/navigation layout.
- Use Flutter semantics for accessible names, roles/actions, and selected state. Keep decorative child semantics from duplicating the parent control.
- Normal-sized text combinations must meet WCAG AA contrast of at least 4.5:1 against their actual surfaces.

## 5. Observable Acceptance Criteria
1. [ ] Every `CustomTextField` exposes its visible label as the editable field's semantic label while retaining editable text-field semantics and existing visible label layout.
2. [ ] Shared hint text and inactive bottom-navigation text meet at least 4.5:1 contrast on their used backgrounds.
3. [ ] Bottom-navigation items expose a named actionable control and the current item exposes selected state; tapping an item still invokes the correct callback.
4. [ ] Flutter widget tests cover field label semantics, navigation label/selection/tap behavior, and contrast calculations.
5. [ ] Dart analysis and the full Flutter test suite pass; formatter and `git diff --check` are clean.
6. [ ] Only this milestone's task documentation, mobile source, and mobile tests are checkpointed; unrelated untracked environment files remain untouched.

## 6. Relevant Files & Affected Areas
- `mobile/lib/widgets/custom_text_field.dart`
- `mobile/lib/widgets/custom_bottom_nav.dart`
- `mobile/lib/core/theme/app_colors.dart`
- `mobile/test/accessibility_widgets_test.dart` (new)
- `docs/ai-workflow/tasks/m16-mobile-accessibility/{TASK_BRIEF.md,PLAN.md,STATUS.md}`
- Baseline: `docs/ai-workflow/tasks/m14-accessibility-audit/AUDIT.md`

## 7. Constraints & Known Risks
- Preserve current visual hierarchy; semantic labeling must not cause a duplicate visible label or alter the input's editable semantics.
- `textHint` is also used by registration and profile controls, so its darker replacement must be checked against each relevant surface.
- Automated semantics tests do not replace TalkBack/VoiceOver checks on physical devices. Physical-device behavior remains outside this local milestone.
- Do not stage or commit `.agents/`, `.codex/`, the supplied logo JPEGs, or unrelated task/environment files.
