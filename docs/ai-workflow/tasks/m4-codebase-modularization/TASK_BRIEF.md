# Task Brief: M4 Codebase Modularization

## 1. Metadata

- **Task ID:** `m4-codebase-modularization`
- **Task Type:** Structural refactor
- **Target Components:** Backend test packages and views, React pages/components, Flutter screens/widgets
- **Planner:** Codex
- **Implementer:** Antigravity
- **Reviewer:** Codex (read-only, milestone by milestone)
- **Target Branch:** Continue `feat/seed-dilg-admin` only after the reviewed M2/M3 changes have a clean, saved boundary.

## 2. Objective & Scope

- **Goal:** Break mixed-responsibility test modules and selected backend/web/mobile source files into domain-focused packages and components without changing product behavior or API contracts.
- **Non-goals:** Feature work, endpoint/schema changes, visual redesign, dependency changes, broad settings/serializer/model rewrites, generated files, lockfiles, and unrelated cleanup. Large files are candidates for responsibility review, not automatic splits based on line count.
- **Context:** `.agents/rules/01-architecture.md` requires avoiding god files and keeping React pages focused on orchestration/layout; `.agents/rules/07-flutter-mobile.md` requires screen widgets to focus on scaffolding/state orchestration and complex UI to live in reusable widgets. Current inventory: `gridy_auth/tests.py` (2,237 lines), `gridy_services/tests.py` (2,138), `gridy_communications/tests.py` (453); backend views `queue.py` (579), `documents.py` (476), `authentication.py` (423); React pages `Register.tsx` (725), `ResidentsManagement.tsx` (666), `LiveQueue.tsx` (590), `ResidentVerification.tsx` (548), `CitizenDocuments.tsx` (482), `Dashboard.tsx` (427); Flutter files `register_screen.dart` (1,223), `field_official_screen.dart` (791), `login_screen.dart` (712), `dashboard_screen.dart` (630), `document_details_dialog.dart` (600), `schedule_screen.dart` (523), `documents_screen.dart` (440), and `queue_screen.dart` (421). `backend/config/settings.py` (478) is a triage-only candidate; split it only if the baseline audit finds clear cohesive configuration boundaries.

## 3. Current Behavior & Evidence

- Backend tests from multiple domains currently share large `tests.py` modules. Examples include registration, token/session lifecycle, resident/media access, onboarding, throttling, origin configuration, documents, queueing, payments, assistance, analytics, and communications.
- Pytest discovery is configured in [`backend/pytest.ini`](../../../../backend/pytest.ini) with `python_files = tests.py test_*.py *_tests.py`. The refactor must preserve both pytest collection and Django `manage.py test` discovery.
- `gridy_services/views/queue.py` contains `QueueTicketViewSet` and `DashboardSummaryView`; `gridy_auth/views/authentication.py` contains token, cookie/logout, password-reset, and session views; `gridy_services/views/documents.py` combines request, payment, and PDF actions.
- React pages contain distinct presentation sections alongside page state and API orchestration. Existing page tests include registration, resident verification, and live queue; add characterization coverage where a targeted page lacks it before moving behavior.
- Flutter screens and dialogs have corresponding test files in `mobile/test/`; preserve widget behavior and keep service/API work in existing service classes. Inspect state ownership and existing widget boundaries before extracting components.
- The current worktree still contains reviewed M2/M3 changes. M4 implementation must wait until those changes are committed or otherwise isolated in a clean implementation baseline; do not mix M4 moves with the M3 security diff.

## 4. Required Business & Architectural Rules

- Follow the root `AGENTS.md`, `.agents/rules/01-architecture.md`, `.agents/rules/04-testing.md`, `.agents/rules/07-flutter-mobile.md`, `.agents/rules/dart-patterns.md`, `.agents/rules/dart-testing.md`, `docs/ai-workflow/playbooks/IMPLEMENTATION.md`, and React container/presentational guidance in `.agents/rules/react-patterns.md`.
- Preserve endpoint paths, router action names, serializers, permissions, query behavior, state transitions, frontend interactions, and mobile/web contracts.
- In React, keep fetching, mutations, and orchestration in page/container components; extracted components should receive data and callbacks through props.
- In Flutter, keep screens declarative and responsible for page scaffolding/state orchestration; extract substantial UI into `mobile/lib/widgets/`. Do not move API calls into widget event handlers or introduce a new state-management pattern.
- In Django, use domain-oriented test modules and view packages. Keep test support helpers in modules that test discovery will not mistake for test modules. Keep `tests/__init__.py` free of class re-exports to avoid duplicate test collection.
- Preserve public imports through package `__init__.py` exports or small compatibility facades where current URL configuration or callers depend on them.
- Do not split solely to hit a line-count target. Each move must follow a real domain or presentation boundary.
- Do not push, deploy, or modify production data as part of implementation. **User-directed workflow amendment (2026-10-10):** Codex is the sole planner/implementer/verifier/reviewer until the user restores collaboration; Codex continues through milestones without waiting for inter-milestone approval, creates a narrow local checkpoint commit after each completed milestone, and starts the next milestone on a new branch. Checkpoints must exclude unrelated and untracked agent/environment files. No push is authorized.

## 5. Observable Acceptance Criteria

1. [ ] `gridy_auth`, `gridy_services`, and `gridy_communications` tests are organized into discoverable domain modules; test methods/assertions are preserved, with no duplicate or missing collection.
2. [ ] Both `venv/bin/pytest backend` and `DEBUG=True venv/bin/python backend/manage.py test` discover and pass the backend tests after the package conversion.
3. [ ] Backend view decomposition preserves all existing import paths used by routers/callers and leaves endpoint URLs, action names, permissions, and response contracts unchanged.
4. [ ] The selected React pages delegate substantial UI sections to feature components while retaining page-level state and API orchestration; existing user interactions and visual behavior remain unchanged.
5. [ ] Tests cover extracted components or page interactions where existing coverage is absent, as required by `.agents/rules/04-testing.md`.
6. [ ] Targeted Flutter widget tests cover extracted interactive widgets, and `dart analyze` plus `flutter test` pass.
7. [ ] No production feature behavior, schema, dependency, migration, API contract, or frontend design changes are introduced.
8. [ ] Targeted checks pass after each milestone; full backend, web, mobile, and diff checks pass at handoff. Actual commands and outputs are recorded in this task's `STATUS.md`.
9. [ ] M4 changes are reviewed independently from the existing M2/M3 changes; all changes remain unstaged unless the user later directs otherwise.

## 6. Relevant Files & Affected Areas

### Backend test modules

- `backend/gridy_auth/tests.py` → `backend/gridy_auth/tests/`
- `backend/gridy_services/tests.py` → `backend/gridy_services/tests/`
- `backend/gridy_communications/tests.py` → `backend/gridy_communications/tests/`
- Preserve `backend/gridy_auth/tests_demo_seed.py` unless the discovery inventory proves a separate change is required.

### Backend source candidates

- `backend/gridy_services/views/queue.py`
- `backend/gridy_services/views/documents.py`
- `backend/gridy_auth/views/authentication.py`
- Relevant `views/__init__.py`, URL modules, and imports that depend on those modules.

### React pages

- `frontend/src/pages/auth/Register.tsx` and its existing test
- `frontend/src/pages/community/ResidentsManagement.tsx`
- `frontend/src/pages/services/LiveQueue.tsx` and its existing test
- `frontend/src/pages/community/ResidentVerification.tsx` and its existing test
- Triage-only: `frontend/src/pages/citizen/CitizenDocuments.tsx` and `frontend/src/pages/admin/Dashboard.tsx`; include only if inspection finds a meaningful component boundary beyond file size.
- Feature components under `frontend/src/components/auth/register/`, `frontend/src/components/residents/`, and `frontend/src/components/queue/` as justified by the existing UI sections.

### Flutter screens and widgets

- `mobile/lib/screens/register_screen.dart` and its existing widget test
- `mobile/lib/screens/field_official_screen.dart` and its existing widget test
- `mobile/lib/screens/login_screen.dart`
- `mobile/lib/screens/dashboard_screen.dart` and its existing widget test
- `mobile/lib/screens/schedule_screen.dart` and its existing widget test
- `mobile/lib/screens/documents_screen.dart` and its existing widget test
- `mobile/lib/screens/queue_screen.dart` and its existing widget test
- `mobile/lib/widgets/document_details_dialog.dart`
- Extracted reusable components under `mobile/lib/widgets/`, following existing feature folders and patterns.

### Triage-only source candidates

- `backend/config/settings.py`: assess grouping/import boundaries during baseline inventory; do not split merely to reduce line count.
- `frontend/src/pages/citizen/CitizenDocuments.tsx` and `frontend/src/pages/admin/Dashboard.tsx`: assess component responsibility and existing tests before deciding whether to include.

## 7. Constraints & Known Risks

- **Implementation gate:** Do not start until the M2/M3 worktree has a clean, saved boundary. Planning artifacts may be prepared now; source moves may not be mixed into the current reviewed diff.
- **Test discovery risk:** A package conversion can change which modules pytest or Django discovers. Compare test collection before/after and run both test runners.
- **Move risk:** Large test moves create noisy diffs. Maintain a source-to-destination mapping in `STATUS.md`, preserve method names/assertions, and keep one app/package per milestone.
- **Import risk:** URL configuration, tests, and internal imports may rely on current view module paths. Preserve stable exports and verify reverse URL behavior.
- **UI risk:** Prop extraction can alter form state, focus, modal lifecycle, or async behavior. Keep state ownership in the page and use existing page tests plus focused component tests.
- **Rollback:** Revert only the current M4 milestone's moves. Do not reset, clean, or broadly checkout the shared worktree.
