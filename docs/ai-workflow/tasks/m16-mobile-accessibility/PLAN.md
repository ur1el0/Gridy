# Implementation Plan: Mobile Accessibility Remediation

## 1. Plan Overview
- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target Branch:** `fix/mobile-accessibility`
- **Base:** `2b2c365`
- **Complexity:** Medium
- **Execution:** One focused milestone; Codex implements and self-reviews under the user's temporary single-agent direction.

## 2. Milestone Breakdown

### Milestone 1: Shared Mobile Field, Contrast, and Navigation Semantics
- **Objective:** Fix the M14 mobile accessibility findings while preserving existing interactions and visible layouts.
- **Files to inspect/modify:**
  - `mobile/lib/widgets/custom_text_field.dart`
  - `mobile/lib/widgets/custom_bottom_nav.dart`
  - `mobile/lib/core/theme/app_colors.dart`
  - `mobile/test/accessibility_widgets_test.dart`
- **Actions:**
  1. Add an accessible name to the `CustomTextField` editable control and retain its existing visible label. Add a semantics regression test that asserts the field is named and still exposes text-field/editing semantics.
  2. Replace the low-contrast hint token with a color that passes 4.5:1 on the input backgrounds where it is used; use the existing muted text token for inactive navigation labels and icons if it passes the white-surface contrast requirement.
  3. Give each navigation item an explicit accessible name, actionable semantics, and selected state while preventing duplicate semantics from its visual children. Preserve its visual layout and callback behavior.
  4. Add widget tests for label semantics, navigation selection and tap callback, and WCAG contrast ratios calculated from the actual color tokens.
  5. Format touched Dart files, run targeted widget tests, full analysis, and the full Flutter test suite. Update `STATUS.md` with actual command outputs and any limitations.
- **Validation commands:**
  ```bash
  /home/dokja/development/flutter/bin/dart format mobile/lib/widgets/custom_text_field.dart mobile/lib/widgets/custom_bottom_nav.dart mobile/lib/core/theme/app_colors.dart mobile/test/accessibility_widgets_test.dart
  /home/dokja/development/flutter/bin/flutter test test/accessibility_widgets_test.dart
  /home/dokja/development/flutter/bin/dart analyze
  /home/dokja/development/flutter/bin/flutter test
  git diff --check
  ```
  Dart/Flutter commands run from `mobile/`.
- **Expected outcome:** The targeted accessibility tests, full analyzer, and complete Flutter test suite pass; no visual redesign or unrelated changes.

## 3. Comprehensive Verification Plan
- [x] Focused mobile accessibility widget tests pass.
- [x] `dart analyze` reports no issues.
- [x] Full `flutter test` passes.
- [x] Formatter makes no further changes.
- [x] `git diff --check` is clean.
- [x] Review exact staged path list before the local checkpoint commit.

## 4. Risks, Dependencies & Rollback
- **Dependencies:** Installed Flutter SDK at `/home/dokja/development/flutter`.
- **Risks:** A label semantics wrapper may replace or duplicate text-field semantics; test the resulting semantics tree, preserving editable actions/value. Shared hint color may affect multiple screens; verify contrast against each audited/actual fill.
- **Rollback:** Revert only the M16 checkpoint commit if a regression is found. Do not alter prior M14/M15 checkpoints.

## 5. Architectural Decisions & Amendments
- Keep the existing separate visual field label and make the editable field announce it programmatically.
- Use existing palette tokens where they meet the contrast threshold; choose a darker hint token only if necessary.
- No plan amendments at start.
