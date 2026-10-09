# Implementation Plan: M4 Codebase Modularization

> **Work contract:** This is a structural refactor with no intended behavior changes. Under the user's 2026-10-10 workflow override, Codex is the sole planner, implementer, verifier, and reviewer until collaboration is explicitly restored. Codex records actual results in `STATUS.md`, self-reviews each milestone, then continues without an inter-milestone user pause. Do not begin source changes until the M2/M3 working changes are saved or isolated from this refactor.

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Task Status:** Complete (Milestones 1–6; see `STATUS.md` for verified results)
- **Checkpoint Branches:** Scoped branch and commit sequence is recorded in `STATUS.md`; final modularization checkpoint is `6b79fe8` on `refactor/m4-full-regression`.
- **Estimated Complexity:** High
- **Role split:** Temporary user-directed override: Codex handles planning, implementation, verification, and review. Antigravity is inactive until the user explicitly restores collaboration.
- **Schema expectation:** No migrations.
- **Branch/checkpoint rule:** At each completed milestone, review and verify the exact milestone diff, update `STATUS.md`, make a scoped local checkpoint commit, and create a new branch for the next milestone. Do not push. Never include `.agents/`, `.codex/`, or unrelated files in a checkpoint.

## 2. Milestone Breakdown

### Milestone 1: Baseline Inventory and Safe Refactor Boundary

- **Objective:** Establish a test/module inventory and separate M4 from the reviewed M2/M3 diff before any moves.
- **Files:** Task `STATUS.md`; inspect the current tests, routers, exports, and target pages.
- **Actions:**
  1. Confirm the M2/M3 changes are saved in a clean baseline. If they remain mixed into the worktree, stop before editing source and report the dependency.
  2. Record current collected test counts for pytest and Django's test runner; record class/test-method source-to-destination mapping for the three backend suites.
  3. Inspect imports and router registrations for the backend view modules; map component boundaries and current test coverage for each React page and Flutter screen/widget.
  4. Update the task status with exact baseline commands and results; do not claim parity until both runners have completed.
- **Validation:**
  ```bash
  venv/bin/pytest backend --collect-only -q
  DEBUG=True venv/bin/python backend/manage.py test gridy_auth gridy_services gridy_communications gridy_reports --verbosity 1
  ```
- **Expected outcome:** A clean M4 implementation base, a source/test mapping, and a baseline count. If the base is not isolated, stop with no source changes.

### Milestone 2: Split Backend Tests into Domain Packages

- **Objective:** Replace three monolithic test modules with domain-oriented test packages without changing test behavior.
- **Files:** `gridy_auth`, `gridy_services`, and `gridy_communications` test packages; `backend/pytest.ini` only if discovery evidence requires a minimal adjustment.
- **Actions:**
  1. Convert each `tests.py` into a `tests/` package with an empty `__init__.py`, focused `test_*.py` modules, and non-discoverable shared support modules such as `base.py`.
  2. Split `gridy_auth` by registration, authentication/session lifecycle, imports, resident verification/directory, media, onboarding, throttling, and origin configuration.
  3. Split `gridy_services` by documents, queue/concurrency, payments, aid, public queue, analytics, and health. Split the current mixed `ServiceAPITests` methods by behavior while preserving shared setup through a base class only where needed.
  4. Split communications tests by announcements, activities, FAQs, and missing-tenant guards.
  5. Preserve existing test names and assertions. Keep test helpers out of discovery patterns and avoid re-exporting test classes from `tests/__init__.py`.
- **Validation:**
  ```bash
  venv/bin/pytest backend/gridy_auth/tests backend/gridy_services/tests backend/gridy_communications/tests --collect-only -q
  venv/bin/pytest backend/gridy_auth/tests backend/gridy_services/tests backend/gridy_communications/tests
  DEBUG=True venv/bin/python backend/manage.py test gridy_auth gridy_services gridy_communications --verbosity 1
  ```
- **Expected outcome:** Test collection count and semantics are preserved under both runners; all three apps pass before moving to source modules.

### Milestone 3: Decompose Backend View Modules

- **Objective:** Move independent view responsibilities into domain modules while keeping router/caller imports stable.
- **Files:** `gridy_services/views/queue.py`, `gridy_services/views/documents.py`, `gridy_auth/views/authentication.py`, their package exports, and relevant URL modules.
- **Actions:**
  1. Move `DashboardSummaryView` out of `gridy_services/views/queue.py` into a dashboard module; keep queue endpoints/actions grouped by queue responsibility.
  2. Split authentication's token, logout/cookie, password recovery, and session view classes into focused modules; preserve existing view imports through `gridy_auth/views/__init__.py` or minimal facades.
  3. Split document request, payment review/reference, and PDF responsibilities only along seams that preserve one `DocumentRequestViewSet` route/action contract. Keep the router action names and URL paths unchanged.
  4. Update imports only; do not alter permissions, serializer selection, database filters, state transitions, or response bodies.
  5. If a class cannot be split cleanly without changing routing or behavior, pause and record that evidence instead of adding a speculative mixin/framework.
- **Validation:**
  ```bash
  venv/bin/pytest backend/gridy_services/tests backend/gridy_auth/tests
  DEBUG=True venv/bin/python backend/manage.py check
  ```
- **Expected outcome:** The views package is organized by responsibility, all URL names/actions remain stable, and targeted backend tests pass.

### Milestone 4: Extract React Page Components

- **Objective:** Keep page components focused on state and orchestration, and move substantial presentation sections into feature components.
- **Files:** `Register.tsx`, `ResidentsManagement.tsx`, `LiveQueue.tsx`, `ResidentVerification.tsx`, related page tests, and feature component directories.
- **Actions:**
  1. Extract existing registration form sections from `Register.tsx` into presentational components under `components/auth/register/`; keep validation, submit payload construction, and API calls in the page/container.
  2. Extract the directory table, resident detail modal, and CSV import UI from `ResidentsManagement.tsx`; keep fetching, mutations, and selection/import orchestration in the page.
  3. Extract live queue sections and history/modal presentation from `LiveQueue.tsx`; keep polling, actions, and queue state in the page.
  4. Extract the verification table, dossier, and rejection confirmation presentation from `ResidentVerification.tsx`; keep approve/reject API actions in the page.
  5. Add focused tests for newly extracted interactive components or missing page coverage; do not redesign copy, styles, navigation, or interaction flow.
  6. During baseline review, assess `CitizenDocuments.tsx` and `Dashboard.tsx`; include either only if it has a clear component boundary and the change remains behavior-preserving.
  7. Add page-level characterization coverage for `ResidentsManagement.tsx`, which currently has no dedicated page test.
- **Validation:**
  ```bash
  npm --prefix frontend run test -- src/pages/auth/Register.test.tsx src/pages/community/ResidentsManagement.test.tsx src/pages/community/ResidentVerification.test.tsx src/pages/services/LiveQueue.test.tsx
  npm --prefix frontend run lint
  npm --prefix frontend run build
  ```
- **Expected outcome:** Existing page behavior and tests remain intact; extracted components have coverage for interactions that are not already characterized.

### Milestone 5: Extract Flutter Screen Widgets

- **Objective:** Reduce oversized Flutter screens and dialogs into focused reusable widgets while following the established mobile architecture.
- **Files:** `mobile/lib/screens/register_screen.dart`, `field_official_screen.dart`, `login_screen.dart`, `dashboard_screen.dart`, `schedule_screen.dart`, `documents_screen.dart`, `queue_screen.dart`, `mobile/lib/widgets/document_details_dialog.dart`, and their existing tests.
- **Actions:**
  1. Inspect each screen's state ownership, service calls, navigation, and existing widget tests before selecting extraction boundaries.
  2. Keep screens declarative and responsible for page scaffolding/state orchestration; move substantial presentation into feature widgets under `mobile/lib/widgets/`.
  3. Keep API calls and mutations in the existing service classes. Do not introduce a new state-management or navigation pattern as part of extraction.
  4. Add or extend widget tests for extracted interactions or UI states not already covered; `login_screen.dart` and `document_details_dialog.dart` currently lack dedicated tests. Preserve semantics, accessibility labels, responsive layout, and keyboard/scroll behavior.
  5. Implement and review in small screen groups; record file-to-widget mappings and actual test counts in `STATUS.md`.
- **Validation:**
  ```bash
  cd mobile
  dart analyze
  flutter test
  ```
- **Expected outcome:** Large screens remain orchestration surfaces, reusable widgets own presentational sections, and existing mobile flows behave the same.

### Milestone 6: Full Regression and Handoff

- **Objective:** Verify the complete structural refactor across backend and frontend and prepare an isolated review diff.
- **Actions:**
  1. Run full backend pytest and Django test discovery, system and migration checks, full frontend test/lint/build, Flutter analyze/tests, and `git diff --check`.
  2. Compare collected test totals with the Milestone 1 baseline and account for every moved test in the mapping.
  3. Record actual commands, outputs, files, deviations, and residual candidates in `STATUS.md`.
  4. Confirm no staged files and request Codex's read-only review before any commit or push.
- **Validation:**
  ```bash
  venv/bin/pytest backend
  DEBUG=True venv/bin/python backend/manage.py test gridy_auth gridy_services gridy_communications gridy_reports --verbosity 1
  DEBUG=True venv/bin/python backend/manage.py check
  DEBUG=True venv/bin/python backend/manage.py makemigrations --check --dry-run
  npm --prefix frontend run lint
  npm --prefix frontend run test
  npm --prefix frontend run build
  cd mobile && dart analyze && flutter test && cd ..
  git diff --check
  git diff --cached --name-only
  ```
- **Expected outcome:** All applicable checks pass, no schema changes are generated, test inventory is preserved, and the diff contains only M4 refactoring.

## 3. Comprehensive Verification Checklist

- [x] M4 began from a baseline isolated from the M2/M3 implementation diff.
- [x] Pytest and Django test discovery both collect the expected backend suites.
- [x] All moved backend tests are represented exactly once and pass.
- [x] Backend URL names, action names, imports, permissions, and response contracts are unchanged.
- [x] Existing React page tests pass and extracted interactive UI has coverage.
- [x] Flutter screens remain declarative; extracted widgets preserve navigation, state, layout, accessibility, and service boundaries.
- [x] `dart analyze` and Flutter tests pass, including coverage for extracted interactive widgets.
- [x] Frontend lint and production build pass.
- [x] Django check and migration dry-run pass with no generated migration.
- [x] `git diff --check` passes; each completed milestone is saved in a scoped local checkpoint commit; no unrelated paths are staged or committed; nothing is pushed without explicit authorization.
- [x] `STATUS.md` contains actual results and the test mapping.

## 4. Risks, Dependencies & Rollback

- **Dirty baseline (resolved):** M2/M3 changes were saved in scoped commits before M4 source moves began. The completed branch/checkpoint sequence is recorded in `STATUS.md`.
- **Discovery behavior:** Pytest and Django use different discovery flows. Running only one runner can silently omit tests.
- **Large rename diff:** Keep one domain/app per milestone and preserve test names/assertions so moves remain reviewable.
- **View routing:** DRF discovers `@action` methods on viewsets; moving action methods must preserve router registration and names. Test URL reversing and API tests after changes.
- **UI state:** React and Flutter extraction can alter form state, focus, modal lifecycle, navigation, layout, or async behavior. Keep state ownership at the existing page/screen level and verify interactions with focused tests.
- **Rollback:** Revert only the current milestone's file moves and imports. Do not use broad reset/clean commands against a shared worktree.

## 5. Triage-Only Candidates (Not Automatically Included)

`backend/config/settings.py` (478), `frontend/src/pages/citizen/CitizenDocuments.tsx` (482), and `frontend/src/pages/admin/Dashboard.tsx` (427) should be assessed by responsibility during the baseline. Include only files with clear cohesive boundaries; do not split them solely because they exceed a line count. Flutter files are in scope for Milestone 5, not a deferred follow-up.
