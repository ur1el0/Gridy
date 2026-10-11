# Implementation Plan: Authentication Media Test Split

> **Work contract:** This is a test organization refactor. Preserve class bodies, method bodies, assertions, fixtures, and discovery behavior. Complete the single milestone, record actual checks in `STATUS.md`, self-review, and create a local scoped checkpoint. Do not push or deploy.

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Task ID:** `m8-auth-media-test-split`
- **Target Branch:** `refactor/split-auth-media-tests`
- **Complexity:** Low

## 2. Milestone 1: Split the Three Media Test Classes

- **Objective:** Give each media-testing concern its own discovery module with no behavioral changes.
- **Files to modify:**
  - Replace `backend/gridy_auth/tests/test_media.py` with:
    - `test_private_media.py` — `ResidentPrivateMediaAPITests`
    - `test_cloudinary_storage.py` — `ResidentAwareCloudinaryStorageTests`
    - `test_media_command.py` — `SecureResidentMediaCommandTests`
  - Add this task's `TASK_BRIEF.md` and `PLAN.md`.
- **Detailed actions:**
  1. Record current targeted test results and class AST fingerprints.
  2. Move each test class verbatim into the focused module with only the imports it uses.
  3. Preserve `tests/__init__.py` as an empty file and keep shared setup in `tests/base.py`.
  4. Verify AST equality for all three classes and exact method discovery counts (12, 3, 3).
  5. Run targeted tests, full backend pytest, Django system check, and diff hygiene checks.
- **Validation commands:**
  ```bash
  # Baseline command, run before moving the classes
  venv/bin/pytest backend/gridy_auth/tests/test_media.py
  # Post-refactor targeted run
  venv/bin/pytest backend/gridy_auth/tests/test_private_media.py backend/gridy_auth/tests/test_cloudinary_storage.py backend/gridy_auth/tests/test_media_command.py
  venv/bin/pytest backend
  DEBUG=True venv/bin/python backend/manage.py check
  git diff --check
  ```
- **Expected outcome:** The baseline targeted test total is unchanged, all three classes remain AST-identical, the backend suite passes, and no application source or unrelated files change.

## 3. Risks & Rollback

- A missed import can break collection; collect/run all new modules before checkpointing.
- A local revert of the M8 checkpoint restores the original test module; there are no database or deployment effects.

## 4. Completion Gate

- [x] Exactly 18 baseline tests remain discoverable across the three modules.
- [x] All three class ASTs match the base checkpoint.
- [x] The test package `__init__.py` remains empty.
- [x] Targeted and full backend tests pass; Django system check is clean.
- [x] Only scoped task and test module paths are staged and committed.
