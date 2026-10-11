# Task Brief: Split Authentication Media Tests by Responsibility

## 1. Metadata

- **Task ID:** `m8-auth-media-test-split`
- **Task Type:** Test refactor
- **Target Component:** Django authentication tests
- **Lead / implementer / reviewer:** Codex (temporary sole-agent mode)
- **Branch:** `refactor/split-auth-media-tests`

## 2. Objective & Scope

- **Goal:** Split the three distinct test classes in `backend/gridy_auth/tests/test_media.py` into focused test modules without changing test behavior or assertions.
- **Non-goals:** No application source changes, test logic edits, fixture changes, test package re-exports, production/database actions, or changes to `.agents/`, `.codex/`, or other pre-existing untracked files.
- **Context:** The M6 source modularity audit identified this 311-line file as a test-only candidate; it combines private resident media API tests, Cloudinary storage tests, and a media migration command test class.

## 3. Current Behavior & Evidence

- `tests/test_media.py` contains `ResidentPrivateMediaAPITests`, `ResidentAwareCloudinaryStorageTests`, and `SecureResidentMediaCommandTests`.
- The classes contain respectively 12, 3, and 3 test methods (18 total); the file also has class-specific imports that should be moved with the relevant tests.
- The current package is `backend/gridy_auth/tests/`; preserve its empty `__init__.py` and shared `base.py`.

## 4. Required Rules

- Keep every test method and assertion unchanged; class ASTs should match the baseline.
- Preserve existing fixtures, mocks, decorators, and test runner discovery behavior.
- Keep `tests/__init__.py` empty; do not re-export test classes.
- Do not change application modules, database schema, migrations, API contracts, or unrelated worktree files.

## 5. Observable Acceptance Criteria

1. [x] The private resident media tests, Cloudinary storage tests, and management command tests live in three focused modules.
2. [x] All 18 baseline test methods and assertions are preserved verbatim; no duplicate discovery occurs.
3. [x] `backend/gridy_auth/tests/__init__.py` remains 0 bytes; unrelated test modules and application source are unchanged.
4. [x] Targeted tests and the full backend pytest suite pass; Django system check passes.
5. [x] Only M8 task/source files are included in its local checkpoint; no push or deployment occurs.

## 6. Relevant Files

- `backend/gridy_auth/tests/test_media.py`
- `backend/gridy_auth/tests/__init__.py`
- `backend/gridy_auth/tests/base.py`
- `docs/ai-workflow/tasks/m8-auth-media-test-split/PLAN.md`
- `docs/ai-workflow/tasks/m8-auth-media-test-split/STATUS.md` (local ignored status log)

## 7. Risks & Mitigations

- **Test discovery drift:** Run targeted pytest and full backend pytest; compare baseline and resulting test counts.
- **Lost shared imports or fixtures:** Move each class together with its required imports and compare class ASTs to the baseline.
- **Unrelated file staging:** Stage explicit paths only and verify the staged name list before committing.
