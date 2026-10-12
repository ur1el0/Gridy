# Implementation Plan: M57 — Distinguish Data Load Failures from Empty Results

## 1. Plan Overview

- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target Branch:** `fix/m57-data-load-error-states`
- **Base:** Remote M56 branch head `f71a3eb8da09b183e877d4dc9f8b3221f52a0cfe` (PR #187 head); PR #187 remains open and unmerged. The local M56 snapshot had an identical tree before the single M57 commit was rebased onto this exact remote head.
- **Estimated Complexity:** Medium
- **Implementation Boundary:** Frontend/mobile data-load presentation and regression tests only.

## 2. Milestone Breakdown

### Milestone 1 — Regression tests for load outcomes

- **Objective:** Encode distinct expected behavior for failed loads, successful empty responses, successful populated responses, and mobile refresh failure.
- **Files to Inspect / Modify:**
  - `frontend/src/pages/admin/DILGDashboard.test.tsx` (new)
  - `mobile/test/documents_screen_test.dart`
- **Detailed Actions:**
  1. Add DILG dashboard tests for initial failure, retry to an empty response, and successful populated response.
  2. Extend the mobile test fake to simulate failures and sequential responses.
  3. Add widget tests proving initial failure is not shown as empty, retry succeeds, and failed refresh preserves existing rows while showing an error.
  4. Run the focused tests before implementation and record the expected red result.
- **Validation Commands:**
  ```bash
  npm --prefix frontend run test -- src/pages/admin/DILGDashboard.test.tsx
  cd mobile && flutter test test/documents_screen_test.dart
  ```
- **Expected Outcome:** New regression tests fail against the current behavior for the asserted reasons.

### Milestone 2 — Add explicit error and empty states

- **Objective:** Make request failure visible and recoverable while retaining existing successful views.
- **Files to Inspect / Modify:**
  - `frontend/src/pages/admin/DILGDashboard.tsx`
  - `mobile/lib/screens/documents_screen.dart`
  - `mobile/lib/widgets/document_requests_error_state.dart` (new if needed)
- **Detailed Actions:**
  1. Add an error state and retry handler to DILG analytics using the existing `InlineErrorState` pattern; show a clear empty state only after a successful empty response.
  2. Track document-fetch errors in `DocumentsScreen`; show a retryable error state when no successful rows are available.
  3. If a mobile refresh fails after a successful load, retain the prior rows and show a visible, accessible inline error/retry affordance.
  4. Keep loading behavior, API paths, chart calculations, and document creation/detail flows unchanged.
- **Validation Commands:**
  ```bash
  npm --prefix frontend run test -- src/pages/admin/DILGDashboard.test.tsx
  cd mobile && flutter test test/documents_screen_test.dart
  ```
- **Expected Outcome:** All M1 regression tests pass, and genuine empty results remain distinct from failed requests.

### Milestone 3 — Regression verification and delivery

- **Objective:** Verify both affected clients, document exact results, and deliver the focused branch.
- **Detailed Actions:**
  1. Run the full frontend test suite, lint, and production build.
  2. Run the full mobile test suite and analyzer.
  3. Run `git diff --check`, inspect the complete scoped diff, and confirm no staged unrelated files, schema changes, or dependencies.
  4. Update `STATUS.md` with commands and actual results; self-review against AC-1–AC-7.
  5. Create a scoped checkpoint commit, push the branch, and open a PR targeting `infra/m56-azure-pilot-go-no-go`; leave it open and unmerged.
- **Validation Commands:**
  ```bash
  npm --prefix frontend run test
  npm --prefix frontend run lint
  npm --prefix frontend run build
  cd mobile && flutter test
  cd mobile && flutter analyze
  git diff --check
  git status --short --branch
  ```
- **Expected Outcome:** All available local checks pass; any unavailable check is recorded as unverified rather than passed; PR is open against M56.

## 3. Risks & Rollback

- A refresh error must not discard known-good rows. The mobile tests explicitly cover this.
- A successful empty DILG response must remain distinguishable from a failed request. Frontend tests cover both outcomes.
- Rollback is reverting the focused UI/test commit. No database rollback or data repair is required.
- Azure remains NO-GO until the M42/M56 owner decisions are resolved; this task performs no cloud operation.

## 4. Architectural Decisions & Plan Amendments

- Use existing frontend `InlineErrorState` rather than creating a new web error component.
- Keep M57 limited to empty-versus-error display and retry behavior. The DILG endpoint's per-barangay query scaling issue is intentionally deferred to a separate performance milestone.
- No plan amendments at baseline.
