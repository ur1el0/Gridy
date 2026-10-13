# Task Brief: Lightweight Gridy Mobile UI Refresh

## 1. Metadata

- **Task ID:** `m88-lightweight-mobile-ui`
- **Task Type:** Mobile UI design and implementation
- **Target Components:** Flutter resident experience and shared mobile theme
- **Writer / Implementer:** Codex (user-directed)
- **Worktree:** `/tmp/gridy-mobile-ui-refresh`
- **Branch:** `feat/mobile-ui-refresh-lightweight`

## 2. Objective & Scope

- **Goal:** Give the resident-facing Flutter app a consistent, accessible civic-service design using Flutter's built-in Material 3 components, with no additional UI package or template dependency.
- **Non-goals:** Do not change API contracts, authentication, tenant/RBAC rules, service/data logic, persistence, route destinations, backend/web code, or official staff workflows.
- **Rationale:** The existing app already uses Flutter Material 3 but combines a small global theme with screen-specific styling. Residents need a calm, readable, predictable interface that remains responsive on lower-spec phones.

## 3. Current Behavior & Evidence

- `mobile/lib/core/theme/app_theme.dart` defines only a small part of the Material theme.
- `mobile/lib/core/theme/app_colors.dart` has brand and neutral tokens, while common surfaces, buttons, and page elements still use per-screen values.
- M79 resident data-integrity behavior is already committed at `938d34f` and must remain intact.

## 4. Required Rules

- Use existing native Flutter Material components and current `AppColors`; add no package dependencies, image assets, background work, or animation libraries.
- Preserve the M79 honest loading, empty, partial-failure, and retry states, along with all existing resident service behavior.
- Keep tenant, authentication, privacy, Treasury, and account-lifecycle rules unchanged.
- Use accessible names for icon-only controls, minimum 48×48 dp touch targets, visible focus/pressed states, and layouts that tolerate text scaling and narrow widths.

## 5. Observable Acceptance Criteria

1. [x] A cohesive Material 3 theme supplies shared color, text, app-bar, card, input, button, and navigation styles.
2. [x] Shared mobile surface/section primitives are reused on the resident dashboard, queue, schedule, and document screens.
3. [x] Login and registration use the same theme without changing validation, authentication, or portal routing behavior.
4. [x] The design keeps the existing KapitBayan navy identity, uses restrained neutral surfaces, and provides clear hierarchy for primary actions and status states.
5. [x] Resident controls remain keyboard/screen-reader operable, have at least 48×48 dp targets, and long labels wrap in shared card layouts.
6. [x] No `pubspec.yaml` or lockfile dependency changes; M79 tests and all mobile tests plus analysis pass.

## 6. Relevant Files

- `mobile/lib/core/theme/app_colors.dart`
- `mobile/lib/core/theme/app_theme.dart`
- `mobile/lib/widgets/` shared resident surfaces and controls
- `mobile/lib/screens/` dashboard, queue, schedule, documents, login, and registration
- `mobile/test/` focused regression coverage where existing tests do not protect preserved behavior

## 7. Risks & Mitigations

- **Risk:** Theme changes can alter legacy controls or status contrast. **Mitigation:** Inspect changed widgets and run full mobile analysis/tests.
- **Risk:** UI edits can accidentally obscure M79 status/error states. **Mitigation:** Keep data logic unchanged and run the M79 queue/dashboard/schedule tests.
- **Risk:** No physical-device/browser surface may be available. **Mitigation:** Record code/test evidence separately from any unperformed device audit.
