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
