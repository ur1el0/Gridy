# Implementation Plan: Lightweight Gridy Mobile UI Refresh

## 1. Plan Overview

- **Associated Brief:** `docs/ai-workflow/tasks/m88-lightweight-mobile-ui/TASK_BRIEF.md`
- **Target Branch:** `feat/mobile-ui-refresh-lightweight`
- **Estimated Complexity:** Medium
- **Design direction:** Dependable civic utility: deep KapitBayan navy for primary actions, warm near-white canvas, quiet outlined surfaces, compact but readable headings, and status colors paired with text/icons.
- **Template decision:** Use Flutter's built-in Material 3 widgets and the existing theme. Do not add FlutterTemplates, Forui, FossUI, or other third-party packages; avoid their runtime/binary overhead and keep the existing architecture.

## 2. Milestones

### M1 — Shared Theme and Primitives

- Expand `AppTheme` with Material 3 app-bar, card, input, button, navigation, and typography styles using existing brand tokens.
- Add lightweight shared spacing/radius/surface/section primitives only where they remove repeated styling.
- Preserve the current brand colors and ensure status colors have text/icon alternatives.

### M2 — Resident Core Screens

- Apply shared theme/primitives to Dashboard, Queue, Schedule, and Documents.
- Refresh Login and Registration with consistent form and primary-action styling.
- Keep each screen's API calls, state transitions, labels required by tests, routes, and empty/error/retry behavior unchanged.
- Keep responsive cards and controls usable at narrow widths and larger text scales.

### M3 — Verification and Handoff

- Review the final diff for changes outside the brief and inspect the `pubspec` diff for zero new dependencies.
- Run Flutter analysis and the full mobile test suite; rerun targeted M79 resident regression tests.
- Run `git diff --check`, record actual results in `STATUS.md`, and prepare a conventional commit and PR title/body. Do not push or open a PR.

### M4 — Redmi Visual Corrective Pass (added 2026-10-14)

- **Evidence:** On the Redmi 12C (720×1650, 320 dpi / 360×825 logical pixels, Android 14, text scale 0.81), the Queue screen's fixed “Get Ticket” action covered the trailing words of the empty “Recent Completions” message.
- **Objective:** Keep the queue action accessible while reserving screen space so the action never paints over queue content; keep the shared resident navigation within the measured 360 dp width.
- **Scope:** Queue screen layout, responsive bottom-navigation item layout, and a focused widget regression test. Keep API calls, ticket action, queue states, and navigation destinations unchanged.
- **Validation:** Run the queue screen test with a phone-sized logical viewport, full mobile tests, `flutter analyze`, `git diff --check`, and repeat the on-device Queue capture.
- **Risk:** A fixed action shelf reduces the visible scroll viewport; retain the existing scroll behavior and bottom navigation.
- **Test calibration:** The initial widget run used Flutter's default text scale 1.0 and reported two flex overflows not present in the device capture. Re-run at the measured device text scale 0.81 before using the overlap assertion.
- **Follow-up evidence:** With the phone-sized 360×825 logical viewport and measured text scale 0.81, the widget test reproduced the CTA overlap and reported a bottom-navigation `RenderFlex` overflow. The corrective pass now includes a responsive navigation row.

## 3. Validation Commands

```bash
cd mobile && FLUTTER_SUPPRESS_ANALYTICS=true /tmp/gridy-flutter-sdk/bin/flutter analyze
cd mobile && FLUTTER_SUPPRESS_ANALYTICS=true /tmp/gridy-flutter-sdk/bin/flutter test
cd mobile && FLUTTER_SUPPRESS_ANALYTICS=true /tmp/gridy-flutter-sdk/bin/flutter test test/queue_screen_test.dart test/queue_service_test.dart test/schedule_screen_test.dart test/dashboard_screen_test.dart
git diff --check
```

## 4. Risks, Dependencies & Rollback

- No app dependencies or data contracts should change.
- If a shared style breaks a screen-specific workflow, narrow the theme override to the affected component rather than altering business behavior.
- Changes are isolated on this branch and can be reverted without touching the primary, M86, or M87 worktrees.
