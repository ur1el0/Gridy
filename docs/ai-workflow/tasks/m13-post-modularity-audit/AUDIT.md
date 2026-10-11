# Post-Modularity Source Audit

- **Date:** 2026-10-10
- **Branch:** `audit/post-modularity-rescan`
- **Base:** M12 request-row extraction, commit `a40f93b`
- **Scope:** Tracked backend, frontend, and mobile source/test files above 300 lines
- **Type:** Read-only audit; no application or test source was changed

## Summary

The current tracked inventory has **36 files above 300 lines**: 30 application source files and 6 test modules. M6 had 40 files (33 source, 7 tests). Four files dropped below the threshold after M7-M12: the service serializer package, auth media tests, citizen documents page, and admin dashboard page. No remaining file showed a comparably clear cross-domain boundary that justifies another size-driven extraction.

The remaining large React pages mostly coordinate one user journey and already use extracted UI sections. The larger Django views and test files each center on one resource or lifecycle. The Flutter screens and service modules are similarly role- or feature-oriented; several already compose extracted widgets. `settings.py` merits a separate configuration-design review if deployment settings need to grow, because moving settings modules affects import order and deployment selection. This audit does not recommend a new source refactor based on line count alone.

## Inventory Method

The inventory was generated from `git ls-files` across `backend/`, `frontend/src/`, and `mobile/lib/`, filtering to `.py`, `.ts`, `.tsx`, and `.dart`, excluding migrations, and counting current lines. AST outlines were used for Python classes/functions; declaration and import outlines were checked for React/Flutter modules. The M6 audit was used as historical evidence and each unchanged finding was checked against the current tree. Generated output, dependencies, assets, and ignored files were excluded.

## Current Files Above 300 Lines

### Backend application source (5)

| File | Lines | Decision | Evidence |
|---|---:|---|---|
| `backend/config/settings.py` | 487 | Defer | One Django settings entry point; environment resolvers and framework settings are coupled to settings import and deployment selection. Split only with a dedicated configuration design. |
| `backend/gridy_services/views/documents.py` | 476 | Keep cohesive | One `DocumentRequestViewSet` owns document-request actions and lifecycle. M4 Action 5 retained this single resource boundary. |
| `backend/gridy_services/views/queue.py` | 423 | Keep cohesive | One `QueueTicketViewSet` owns queue ticket actions; `DashboardSummaryView` is already in `views/dashboard.py`. |
| `backend/gridy_auth/management/commands/seed_barangays.py` | 395 | Keep cohesive | One Django `Command` implements one barangay seeding operation and its local helpers. |
| `backend/gridy_auth/management/commands/seed_demo_analytics.py` | 319 | Keep cohesive | One Django `Command` creates synthetic analytics fixtures for the demo environment. |

### Frontend application source (7)

| File | Lines | Decision | Evidence |
|---|---:|---|---|
| `frontend/src/pages/auth/Register.tsx` | 481 | Keep cohesive | One registration flow owns validation and submission; hero, uploads, barangay selection, and admin credentials are already extracted child components. |
| `frontend/src/pages/services/LiveQueue.tsx` | 472 | Keep cohesive | One live queue workflow owns polling, announcements/audio, priority actions, and history; its large UI sections are already extracted. |
| `frontend/src/pages/services/DocumentRequests.tsx` | 367 | Keep cohesive | One official document-request lifecycle coordinates list, validation, payment review, PDF, deletion, and walk-in creation. |
| `frontend/src/pages/citizen/CitizenQueue.tsx` | 364 | Keep cohesive | One resident queue flow owns status polling, ticket creation, cancellation, and current status. |
| `frontend/src/pages/services/Announcements.tsx` | 363 | Keep cohesive | One announcement management feature owns create/delete, image upload, pinning, and sharing. |
| `frontend/src/pages/public/PublicQueueDisplay.tsx` | 352 | Keep cohesive | One public display owns queue polling, audio, and spoken ticket announcements. |
| `frontend/src/pages/auth/Login.tsx` | 329 | Keep cohesive | One login page owns credential submission and resident/official mode handling. |

### Mobile application source (18)

| File | Lines | Decision | Evidence |
|---|---:|---|---|
| `mobile/lib/screens/register_screen.dart` | 571 | Keep cohesive | One resident-registration flow owns input state, validation, evidence selection, submission, and navigation; registration-detail and identity sections are extracted widgets. |
| `mobile/lib/screens/login_screen.dart` | 503 | Keep cohesive | One authentication flow owns login mode, credentials, and navigation; reusable fields, buttons, and logo are separate widgets. |
| `mobile/lib/screens/schedule_screen.dart` | 447 | Keep cohesive | One schedule screen coordinates selected date and loaded schedule; cards and date/detail presentation are separate widgets. |
| `mobile/lib/screens/dashboard_screen.dart` | 401 | Keep cohesive | One resident dashboard coordinates its data and navigation while composing dedicated dashboard widgets. |
| `mobile/lib/screens/field_official_screen.dart` | 375 | Keep cohesive | One field-official workspace coordinates queue, clearance, and report tabs; each tab's primary UI is extracted into a widget. |
| `mobile/lib/screens/profile_screen.dart` | 364 | Keep cohesive | One profile edit/view flow owns field state, save, date selection, and logout. |
| `mobile/lib/screens/admin_dashboard_screen.dart` | 343 | Keep cohesive | One admin dashboard owns its metrics and navigation actions. |
| `mobile/lib/screens/documents_screen.dart` | 338 | Keep cohesive | One resident document workflow coordinates data and navigation; request and detail dialogs/cards are separate widgets. |
| `mobile/lib/screens/hotlines_screen.dart` | 329 | Keep cohesive | One hotline directory flow owns loading, category/search filters, and call actions. |
| `mobile/lib/screens/queue_screen.dart` | 328 | Keep cohesive | One resident queue flow coordinates queue data, ticket actions, and navigation; cards and request sheet are separate widgets. |
| `mobile/lib/screens/forgot_password_screen.dart` | 325 | Keep cohesive | Form and completion views are states of one password-reset flow. |
| `mobile/lib/screens/announcements_screen.dart` | 322 | Keep cohesive | One announcement list/detail flow; detail presentation is contained in its associated sheet. |
| `mobile/lib/widgets/resident_registration_details_section.dart` | 388 | Keep cohesive | One stateless registration form section owns related resident-detail fields. |
| `mobile/lib/widgets/document_details_dialog.dart` | 384 | Keep cohesive | One document detail dialog coordinates download and payment reference; summary and payment sections are extracted widgets. |
| `mobile/lib/core/network/api_client.dart` | 379 | Keep cohesive | One transport boundary owns URI/header construction, HTTP methods, credential refresh, and response errors. |
| `mobile/lib/widgets/resident_identity_verification_section.dart` | 349 | Keep cohesive | One evidence form section composes reusable text and photo-upload widgets. |
| `mobile/lib/widgets/request_document_dialog.dart` | 343 | Keep cohesive | One document request form dialog; the urgency choice is already a dedicated child widget. |
| `mobile/lib/services/auth_service.dart` | 320 | Keep cohesive | One auth service owns login, registration, profile, refresh, logout, and password-reset API operations. |

### Test modules (6)

| File | Lines | Decision | Evidence |
|---|---:|---|
| `backend/gridy_services/tests/test_payments.py` | 530 | Keep cohesive | One `DocumentPaymentWorkflowTests` class with 18 methods covers the payment-reference, review, receipt, and release lifecycle. |
| `backend/gridy_auth/tests/test_authentication.py` | 476 | Keep cohesive | One `AuthAPITests` class with 13 methods covers login, refresh rotation, logout, and session revocation. |
| `backend/gridy_services/tests/test_queue.py` | 452 | Keep cohesive | One `QueueTicketAPITests` class with 19 methods covers ticket creation, priority, advancement, sequencing, and cancellation. |
| `backend/gridy_services/tests/test_documents.py` | 424 | Keep cohesive | One `DocumentRequestAPITests` class with 20 methods covers request creation, walk-ins, validation, PDF, fees, and cancellation. |
| `backend/gridy_auth/tests/test_registration.py` | 327 | Keep cohesive | One `AuthRegistrationAPITests` class with 13 methods covers resident/official registration, validation, and consent. |
| `frontend/src/pages/services/LiveQueue.test.tsx` | 317 | Keep cohesive | Tests the single LiveQueue component; browser audio/speech mocks support the component's announcement behavior. |

## Reconciliation with M6 and M7-M12

M6 identified `backend/gridy_services/serializers.py` as a clear cross-domain source boundary, and M7 split it into a package with focused serializer modules and a compatibility export surface. M6's lower-priority `backend/gridy_auth/tests/test_media.py` was split in M8. M9-M12 extracted the citizen-document request modal, payment-reference form, admin dashboard sections, and citizen document request rows. The current counts confirm that all four M6 entries are below 300 lines; no new >300-line candidate replaced them.

The six files above 300 lines in the current test inventory each represent one API/resource lifecycle or one component. The inventory does not support further test-package splitting by file size alone.

## Recommendation

Close the post-modularity rescan without a follow-on size-driven refactor. Continue with the already requested KapitBayan brand transition as a separate milestone, preserving database/migration identifiers and external infrastructure identifiers until a coordinated migration or provisioning plan exists. Keep the frontend accessibility audit as a separate quality milestone rather than mixing it into a branding change.

## Verification

- Frontend lint: `npm --prefix frontend run lint` — passed, 0 warnings and 0 errors.
- Frontend tests: `npm --prefix frontend run test` — passed, 27 test files and 73 tests.
- Inventory: 36 tracked files over 300 lines (30 application source, 6 test modules).
- `git diff --check` — clean.
- `git diff --cached --name-only` — empty.
- Application/test source diff — empty.
- Existing `.agents/`, `.codex/`, logo files, and other untracked task/environment content were not edited or staged. They have no tracked Git baseline, so historical change detection is unavailable.
