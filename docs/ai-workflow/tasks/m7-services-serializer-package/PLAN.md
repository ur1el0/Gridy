# Implementation Plan: Services Serializer Domain Package

> **Work contract:** This is a behavior-preserving refactor. Codex is the sole planner, implementer, verifier, and reviewer until the user restores collaboration. Complete the milestone, record actual checks in `STATUS.md`, self-review the diff, and create a scoped local checkpoint. Do not push or deploy.

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Task ID:** `m7-services-serializer-package`
- **Target Branch:** `refactor/services-serializer-package`
- **Complexity:** Medium
- **Schema expectation:** No model or migration changes; the moved serializer definitions and component names should remain stable. The checked-in schema baseline is stale; see the amendment below.

## 2. Milestone Breakdown

### Milestone 1: Extract Serializer Domains and Preserve the Public Import Surface

- **Objective:** Organize the 390-line mixed serializer module by domain without changing code behavior or view imports.
- **Files to modify:**
  - Replace `backend/gridy_services/serializers.py` with `backend/gridy_services/serializers/`.
  - Add `__init__.py`, `documents.py`, `payments.py`, `aid.py`, `queue.py`, and `dashboard.py`.
- **Detailed actions:**
  1. Move `FeePolicyValidationMixin`, `DocumentRequestSerializer`, and `DocumentRequestReviewSerializer` to `documents.py`.
  2. Move `PaymentReferenceSerializer` and `PaymentReviewSerializer` to `payments.py`.
  3. Move `AidRequestSerializer` and `AidRequestReviewSerializer` to `aid.py`.
  4. Move `QueueTicketSerializer`, `QueueTicketPrioritySerializer`, and `PublicQueueStatusSerializer` to `queue.py`.
  5. Move `DocumentStatsSerializer`, `UrgencyBreakdownSerializer`, `IssueStatsSerializer`, `QueueActivitySerializer`, and `DashboardSummarySerializer` to `dashboard.py`.
  6. Re-export the exact public names from package `__init__.py`; leave all view imports and `payment_serializers.py` unchanged.
  7. Inspect the class diff to ensure method bodies and fields were only relocated.
- **Validation commands:**
  ```bash
  venv/bin/pytest backend/gridy_services/tests
  venv/bin/pytest backend
  DEBUG=True venv/bin/python backend/manage.py test gridy_auth gridy_services gridy_communications gridy_reports --verbosity 1
  DEBUG=True venv/bin/python backend/manage.py check
  DEBUG=True venv/bin/python backend/manage.py makemigrations --check --dry-run
  DEBUG=True venv/bin/python backend/manage.py spectacular --file /tmp/m7-services-schema.yml --validate
  diff -u backend/schema.yml /tmp/m7-services-schema.yml
  git diff --check
  ```
- **Expected outcome:** Service and full backend suites pass; use the actual current counts recorded in `STATUS.md` because this branch includes test additions after the M4 baseline. Django check is clean; no migrations are generated. Schema generation completes with the previously recorded diagnostics (14 warnings, 17 errors), serializer class/component names remain stable, and differences from the checked-in `backend/schema.yml` are compared and classified rather than blindly updated.

### Plan amendment: checked-in schema baseline is stale

Initial schema generation showed that `backend/schema.yml` predates current API state: the generated schema includes six existing onboarding/payment-recipient paths absent from the checked-in file, and current `DocumentRequest`/`PaymentMethodEnum` schemas include payment snapshot fields and methods missing from that file. These differences are unrelated to the serializer relocation: all 15 original serializer/mixin class ASTs are identical after extraction, and current schema diagnostics match the previously recorded 14 warnings/17 errors. Do not regenerate or commit `backend/schema.yml` in this task. Verify stable class names and definitions and record the baseline drift in `STATUS.md`.

## 3. Risks & Rollback

- Python's `gridy_services.serializers` import will resolve to the new package; the `__init__.py` exports preserve existing imports.
- If serializer component names or definitions change, inspect the OpenAPI diff and restore the affected serializer metadata before checkpointing. Do not treat the recorded unrelated `backend/schema.yml` drift as a change caused by this refactor.
- Rollback is a local revert of the milestone checkpoint; there are no database or deployment effects.

## 4. Completion Gate

- [x] All 15 existing classes/mixins appear once in the domain package.
- [x] All original public names are re-exported.
- [x] No view callers or `payment_serializers.py` changed.
- [x] Service tests and full backend regression pass.
- [x] Django check/migration check pass; schema generation completes with known diagnostics and serializer component names/definitions remain stable.
- [x] Only task files and this milestone's code are staged; existing untracked environment files remain untouched.
