# Task Brief: Services Serializer Domain Package

## 1. Metadata

- **Task ID:** `m7-services-serializer-package`
- **Task Type:** Backend refactor
- **Target Component:** Django services serializers
- **Lead / implementer / reviewer:** Codex (temporary sole-agent mode)
- **Branch:** `refactor/services-serializer-package`

## 2. Objective & Scope

- **Goal:** Replace the cross-domain `backend/gridy_services/serializers.py` module with a domain-organized `serializers/` package while preserving every serializer's behavior and existing public import path.
- **Non-goals:** No field, validation, permission, API response, view, model, schema, or database behavior changes; no dependency additions; no changes to `payment_serializers.py`; no production actions.
- **Context:** The 390-line module contains document/payment request, aid, queue/public queue, and dashboard analytics serializers. Five view modules import names through `gridy_services.serializers`, so a package `__init__.py` must preserve those names.

## 3. Current Behavior & Evidence

- `backend/gridy_services/serializers.py` contains 15 classes grouped across distinct service domains.
- The existing serializer groups are: document/request + fee policy, payment reference/review, aid request/review, queue/public status, and dashboard aggregate payloads.
- Production views import through `from gridy_services.serializers import ...` in `views/documents.py`, `views/aid.py`, `views/queue.py`, `views/public_queue.py`, and `views/dashboard.py`.
- `PaymentRecipientSerializer` is already isolated in `backend/gridy_services/payment_serializers.py` and remains out of scope.

## 4. Required Business & Architectural Rules

- Preserve serializer class names and export them from `gridy_services.serializers`.
- Copy class bodies without changing fields, validators, defaults, method behavior, or API response shapes.
- Keep `FeePolicyValidationMixin` with document serializers; preserve `enforce_fee_policy` use.
- Preserve all RBAC and tenant-sensitive serialization logic, including the DILG payment-recipient snapshot guard and priority-ticket validation.
- No migrations or model changes.

## 5. Observable Acceptance Criteria

1. [ ] The old monolithic `backend/gridy_services/serializers.py` becomes a package containing focused domain modules for documents, payment workflow, aid, queue, and dashboard serialization.
2. [ ] `backend/gridy_services/serializers/__init__.py` re-exports all 15 existing serializer/mixin names so existing view imports remain valid.
3. [ ] Serializer fields and validation behavior are unchanged; tenant/privacy and priority rules remain covered by existing tests.
4. [ ] Service tests, full backend pytest, the explicit Django test runner, Django system check, migration dry-run, and schema generation complete. Serializer class names/definitions remain stable, and existing drift between generated schema and `backend/schema.yml` is recorded without being mixed into this refactor.
5. [ ] No unrelated files are staged or included in the local checkpoint; `.agents/`, `.codex/`, supplied JPEGs, and other untracked content remain untouched.

## 6. Relevant Files

- `backend/gridy_services/serializers.py`
- `backend/gridy_services/payment_serializers.py` (inspect only)
- `backend/gridy_services/views/`
- `backend/gridy_services/tests/`
- `docs/ai-workflow/tasks/m7-services-serializer-package/PLAN.md`
- `docs/ai-workflow/tasks/m7-services-serializer-package/STATUS.md` (local status log; ignored by repository policy)

## 7. Risks & Mitigations

- **Import compatibility:** Keep every existing public serializer name exported from the package root and run Django checks plus all backend tests.
- **Accidental behavior drift during moves:** Extract class bodies without edits and review the class-level diff; compare generated OpenAPI output with `backend/schema.yml`.
- **Import cycles:** Keep each module importing only its direct model/policy dependencies; do not import views or services from serializer modules.
