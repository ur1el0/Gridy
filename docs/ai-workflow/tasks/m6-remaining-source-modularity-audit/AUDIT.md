# Remaining Source Modularity Audit

- **Date:** 2026-10-10
- **Branch:** `audit/remaining-source-modularity`
- **Scope:** Tracked application source and test modules above roughly 300 lines, reviewed against `.agents/AGENTS.md` and `.agents/rules/01-architecture.md`.
- **Execution:** Read-only; no source or test code changed.

## Summary

The inventory contains 33 application source files and 7 test modules over 300 lines. Most are cohesive single-page or single-domain units, and several Flutter/React screens already compose extracted widgets/components from M4. One clear cross-domain source module remains: `backend/gridy_services/serializers.py` (390 lines) mixes document/payment, aid, queue, public queue, and dashboard serializers. Recommend that as the next implementation target, preserving existing imports through a package `__init__.py` export surface.

`backend/gridy_auth/tests/test_media.py` (311 lines) is a secondary, lower-priority candidate because it contains three distinct test classes for private media endpoints, Cloudinary storage, and a management command. Keep it for a later test-only cleanup so the next source refactor remains focused.

### Recommendation

Create a separate implementation task to convert `backend/gridy_services/serializers.py` into a domain package with focused modules for documents, payment workflow, aid, queue, and dashboard serialization. Preserve imports such as `from gridy_services.serializers import DashboardSummarySerializer` through `serializers/__init__.py`. Leave `gridy_services/payment_serializers.py` as its existing separate `PaymentRecipientSerializer` boundary unless implementation evidence shows a necessary dependency change.

Expected risk is low to medium: moving class definitions should not change fields or validation, but serializer imports are used by five view modules and must retain their public names. Validation should cover the service test package, complete backend pytest and Django suites, Django system check, migration dry-run, and schema generation/diff if available.

## Method and Inventory

The inventory was generated from `git ls-files` for `.py`, `.ts`, `.tsx`, and `.dart` files, then filtered by current line count. It excludes migration directories, generated/build output, assets, dependencies, and lockfiles. Test modules were inventoried separately. The file outline was checked for top-level classes/functions, React hooks and imported child components, Flutter state and widget methods, and test classes/methods. M4’s plan/status was consulted to avoid repeating completed extractions.

### Backend application source (6 files)

| File | Lines | Decision | Evidence and rationale |
|---|---:|---|---|
| `backend/gridy_services/serializers.py` | 390 | **Refactor — next target** | Contains five distinct serializer groups: document/payment workflow (`#L6-L157`), aid (`#L160-L220`), queue/public queue (`#L223-L357`), and dashboard analytics (`#L360-L390`). The classes map cleanly to existing view domains. |
| `backend/config/settings.py` | 487 | **Defer** | A single Django settings module combines environment resolution with framework configuration. Splitting settings files changes deployment selection/import order and needs a separate configuration design; size alone does not justify it. |
| `backend/gridy_services/views/documents.py` | 476 | **Keep cohesive** | One `DocumentRequestViewSet` (`#L28-L476`) owns the document request lifecycle. M4 explicitly reviewed and retained it as one DRF resource. |
| `backend/gridy_services/views/queue.py` | 423 | **Keep cohesive** | One `QueueTicketViewSet` (`#L26-L423`) owns queue lifecycle and queue actions; the dashboard view was already extracted to `views/dashboard.py`. |
| `backend/gridy_auth/management/commands/seed_barangays.py` | 395 | **Keep cohesive** | One Django `Command` class (`#L10-L395`) implements the barangay seeding command and its helpers. No independent runtime module boundary was identified. |
| `backend/gridy_auth/management/commands/seed_demo_analytics.py` | 319 | **Keep cohesive** | One management command (`#L33-L319`) creates synthetic analytics fixtures. The size reflects a single seed operation and its local data, not multiple application domains. |

### Frontend application source (9 files)

| File | Lines | Decision | Evidence and rationale |
|---|---:|---|---|
| `frontend/src/pages/citizen/CitizenDocuments.tsx` | 482 | **Defer** | Combines request creation, cancellation, PDF download, and payment-reference submission (`#L54-L194`) with one resident document-request screen (`#L231-L482`). A payment panel or request form could be extracted, but state and per-request actions are coupled; plan a focused component boundary with characterization tests first. |
| `frontend/src/pages/auth/Register.tsx` | 481 | **Keep cohesive** | M4 already extracted registration hero, verification uploads, barangay selection, and admin credential sections. The page now owns form state, validation, and submission orchestration. |
| `frontend/src/pages/services/LiveQueue.tsx` | 472 | **Keep cohesive** | M4 extracted metrics, active/waiting views, queue controls, new-ticket modal, and history modal. Remaining polling/state/action handlers belong to one live queue workflow. |
| `frontend/src/pages/admin/Dashboard.tsx` | 427 | **Defer** | One dashboard fetches a summary and activity feed, derives chart data, and renders metrics/charts/activity (`#L95-L179`, `#L179-L427`). Presentation extraction is possible, but no page-level characterization test currently protects it; assess separately after the serializer refactor. |
| `frontend/src/pages/services/DocumentRequests.tsx` | 367 | **Keep cohesive** | It manages the document request lifecycle and already composes `DocumentTable` and `ReviewDocumentModal`; walk-in creation is part of this same resource workflow. |
| `frontend/src/pages/citizen/CitizenQueue.tsx` | 364 | **Keep cohesive** | One resident queue flow owns polling, ticket request/cancel actions, and status rendering. |
| `frontend/src/pages/services/Announcements.tsx` | 363 | **Keep cohesive** | One announcement management page owns create/delete, image upload, pinning, and sharing; the state and API actions share a single feature. |
| `frontend/src/pages/public/PublicQueueDisplay.tsx` | 352 | **Keep cohesive** | One public queue display owns polling, ticket announcements, audio controls, and the display surface. |
| `frontend/src/pages/auth/Login.tsx` | 329 | **Keep cohesive** | One login page owns resident/official mode, credential submission, and role-boundary messaging. |

### Flutter application source (18 files)

| File | Lines | Decision | Evidence and rationale |
|---|---:|---|---|
| `mobile/lib/screens/register_screen.dart` | 571 | **Keep cohesive** | M4 already extracted registration details and identity-verification widgets. The screen retains form controllers, photo/date selection, validation, service submission, and orchestration (`#L88-L349`). |
| `mobile/lib/screens/login_screen.dart` | 503 | **Keep cohesive** | Credentials and privacy/support sheets are extracted. The page retains login, resident/official mode, and navigation as one auth workflow. |
| `mobile/lib/screens/schedule_screen.dart` | 447 | **Keep cohesive** | Calendar strip, schedule cards, and detail dialogs are extracted; remaining state manages the selected date and schedule loading. |
| `mobile/lib/screens/dashboard_screen.dart` | 401 | **Keep cohesive** | Imports dedicated hero, metric, quick-service, schedule, notification, and navigation widgets. It coordinates resident dashboard data and routing. |
| `mobile/lib/screens/field_official_screen.dart` | 375 | **Keep cohesive** | Queue, clearance-validation, and reports tabs are separate widgets. The screen coordinates shared official services and tab state. |
| `mobile/lib/screens/profile_screen.dart` | 364 | **Keep cohesive** | A single profile view/edit, save, date selection, and logout flow. |
| `mobile/lib/screens/admin_dashboard_screen.dart` | 344 | **Keep cohesive** | One official dashboard with metrics and navigation actions; helper card builders do not reveal a separate domain. |
| `mobile/lib/screens/documents_screen.dart` | 338 | **Keep cohesive** | Already composes request cards, search, empty state, request dialog, and detail dialog; remaining screen coordinates document data and navigation. |
| `mobile/lib/screens/hotlines_screen.dart` | 330 | **Keep cohesive** | One directory flow: load, category/search filter, and call a hotline. |
| `mobile/lib/screens/queue_screen.dart` | 328 | **Keep cohesive** | Already composes queue hero/metrics, ticket cards, recent completions, and the request sheet; the page coordinates one resident queue flow. |
| `mobile/lib/screens/forgot_password_screen.dart` | 326 | **Keep cohesive** | `_buildForm` and `_buildCompletion` are two states of one password reset flow, not separate features. |
| `mobile/lib/screens/announcements_screen.dart` | 323 | **Keep cohesive** | One announcements list and its announcement detail sheet. |
| `mobile/lib/widgets/resident_registration_details_section.dart` | 388 | **Keep cohesive** | One stateless resident-details form section consumed by registration; size corresponds to its field group. |
| `mobile/lib/widgets/document_details_dialog.dart` | 384 | **Keep cohesive** | One document details dialog; payment and request summary sections are already separate widgets. It owns download and payment-reference interactions. |
| `mobile/lib/core/network/api_client.dart` | 379 | **Keep cohesive** | One transport boundary owns HTTP verbs, credential refresh, headers, URI building, and response errors. Splitting by HTTP verb would fragment one client. |
| `mobile/lib/widgets/resident_identity_verification_section.dart` | 349 | **Keep cohesive** | One identity-evidence form section, already composed from reusable text and photo upload widgets. |
| `mobile/lib/widgets/request_document_dialog.dart` | 343 | **Keep cohesive** | One request form dialog; urgency choice is already represented by a private child card. |
| `mobile/lib/services/auth_service.dart` | 320 | **Keep cohesive** | Login, registration, profile, refresh, logout, and password reset methods belong to one auth service boundary. |

### Test modules (7 files)

| File | Lines | Decision | Evidence and rationale |
|---|---:|---|
| `backend/gridy_services/tests/test_payments.py` | 530 | **Keep cohesive** | One `DocumentPaymentWorkflowTests` class (18 tests) covers recipient setup, references, payment review, and receipt/release rules: one payment workflow. |
| `backend/gridy_auth/tests/test_authentication.py` | 476 | **Keep cohesive** | One `AuthAPITests` class (13 tests) covers login, reset, refresh rotation, and logout/session revocation as one authentication/session lifecycle. |
| `backend/gridy_services/tests/test_queue.py` | 452 | **Keep cohesive** | One queue API test class (19 tests) covers ticket creation, priority, advancement, sequencing, and cancellation. |
| `backend/gridy_services/tests/test_documents.py` | 424 | **Keep cohesive** | One document request API test class (20 tests) covers resident/walk-in creation, validation, PDF, fee, and cancellation lifecycle. |
| `backend/gridy_auth/tests/test_registration.py` | 327 | **Keep cohesive** | One registration test class (13 tests) covers resident/admin registration, validation, and consent. |
| `backend/gridy_auth/tests/test_media.py` | 311 | **Defer — later test-only candidate** | Contains three separate classes for private media API access, Cloudinary storage, and secure media management commands (`#L19-L298`), with different test bases. They can be split cleanly, but this is lower priority than the cross-domain production serializer module. |
| `frontend/src/pages/services/LiveQueue.test.tsx` | 317 | **Keep cohesive** | The test file covers one queue component; its speech/audio mocks support queue announcement tests in the same component. |

## Follow-on Implementation Contract

The next implementation branch should split only the services serializer module. Suggested layout:

```text
backend/gridy_services/serializers/
  __init__.py       # compatibility exports
  documents.py      # document request and review serializers + fee-policy mixin
  payments.py       # payment-reference and payment-review serializers
  aid.py            # aid request and review serializers
  queue.py          # queue ticket, priority, and public status serializers
  dashboard.py      # dashboard aggregate serializers
```

Keep all public class names importable from `gridy_services.serializers`. Do not alter serializer field definitions, validators, or API response shapes. Existing `payment_serializers.py` remains out of scope. Run service tests first, then full backend pytest and the explicit Django test runner, Django check, migration dry-run, schema validation if the existing schema command is available, and `git diff --check`.

## Verification and Hygiene

- `git ls-files '*.py' '*.ts' '*.tsx' '*.dart'` plus the inventory script listed the tracked source surface; 33 application source files and 7 test modules exceeded 300 lines.
- Python AST, TypeScript/Dart declaration outlines, existing component imports, and test class/method outlines were inspected for all inventory entries.
- No backend, frontend, or mobile test suite was run because this audit changes no code.
- `git diff --check`: clean.
- `git diff --cached --name-only`: empty during audit.
- No application source or test code was modified. `.agents/`, `.codex/`, and supplied JPEGs have no tracked Git baseline; no audit command or patch targeted them.
