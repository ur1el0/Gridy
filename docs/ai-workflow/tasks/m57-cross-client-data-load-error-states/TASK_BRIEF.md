# Task Brief: M57 — Distinguish Data Load Failures from Empty Results

## 1. Metadata

- **Task ID:** `m57-cross-client-data-load-error-states`
- **Task Type:** Bug Fix
- **Target Components:** Frontend, Mobile
- **Lead / Writer / Reviewer:** Codex (user-directed sole-agent mode)
- **Branch:** `fix/m57-data-load-error-states`
- **Base:** Exact remote M56 branch head `f71a3eb8da09b183e877d4dc9f8b3221f52a0cfe` (PR #187 head); the local checkpoint `3ec0119` had the same content tree and was replaced by a narrow rebase of only the M57 commit.

## 2. Objective & Scope

- **Goal:** Show retryable load errors in the DILG analytics dashboard and resident mobile document history instead of presenting failed requests as valid empty results.
- **Non-goals:** Do not change APIs, analytics calculations, database schema, migrations, dependencies, payment behavior, tenant/RBAC rules, Azure configuration, or deployment resources. The separate DILG analytics query-scaling finding is deferred to its own milestone.
- **Problem statement:** If DILG analytics fails to load, the web page renders blank charts after logging only to the console. If a resident's document request fetch fails, the mobile page renders “No active document requests.” Residents and officials cannot distinguish service failure from a true empty result or retry reliably.

## 3. Current Behavior & Evidence

- `frontend/src/pages/admin/DILGDashboard.tsx:25-40` catches the analytics request error, logs it, and clears `loading`; `data` remains `[]`, so the chart layout renders without an error or empty-state message. There is no `DILGDashboard` test file.
- `mobile/lib/screens/documents_screen.dart:73-90` catches document fetch errors, clears `_isLoading`, and leaves `_requests` empty. `mobile/lib/screens/documents_screen.dart:296-299` then renders `EmptyDocumentRequests`, which says no active requests. Current `mobile/test/documents_screen_test.dart` covers populated success paths but not request failures or retry.
- The web citizen document page already uses `InlineErrorState` and tests the distinction between failed and successful-empty fetches (`frontend/src/pages/citizen/CitizenDocuments.tsx:178-205`, `frontend/src/pages/citizen/CitizenPortal.test.tsx:70-90`).

## 4. Required Business & Architectural Rules

- **Barangay Multi-Tenancy:** No query or tenancy behavior changes.
- **RBAC:** No authorization changes; DILG analytics remains restricted to DILG admins and resident documents remain scoped by the existing API.
- **Session & Token Security:** No authentication changes.
- **Treasury & Audit Rules:** No payment, receipt, or audit behavior changes.
- **Background Tasks:** No background task changes; do not add Celery or Redis.
- Keep successful empty responses distinct from request failures. Preserve previously loaded mobile requests if a later refresh fails.
- Retry controls must remain keyboard/screen-reader accessible and must not expose exception details.

## 5. Observable Acceptance Criteria

1. [x] **AC-1:** A failed initial DILG analytics request displays a visible, accessible error message and retry button; it does not render a successful-empty result.
2. [x] **AC-2:** Retrying DILG analytics after a failure and receiving an empty array displays an explicit successful-empty state; receiving data renders the existing charts.
3. [x] **AC-3:** A failed initial mobile document request displays a visible, accessible error state and retry action; it does not display “No active document requests.”
4. [x] **AC-4:** Retrying mobile document requests successfully transitions to the populated or genuine-empty state.
5. [x] **AC-5:** A failed mobile refresh preserves already-loaded rows and communicates the refresh failure without replacing those rows with an empty state.
6. [x] **AC-6:** No API, database/schema, dependency, payment, tenant/RBAC, or Azure behavior changes are introduced.
7. [x] **AC-7:** Targeted and full frontend/mobile checks pass, and actual results are recorded in `STATUS.md`.

## 6. Relevant Files & Affected Areas

- `frontend/src/pages/admin/DILGDashboard.tsx`
- `frontend/src/pages/admin/DILGDashboard.test.tsx` (new)
- `mobile/lib/screens/documents_screen.dart`
- `mobile/lib/widgets/document_requests_error_state.dart` (new, if kept as a focused presentation widget)
- `mobile/test/documents_screen_test.dart`
- `docs/ai-workflow/tasks/m57-cross-client-data-load-error-states/{TASK_BRIEF.md,PLAN.md,STATUS.md}`

## 7. Constraints & Known Risks

- This branch is stacked on the open M56 PR #187. Keep M56 as the PR base, leave both PRs open and unmerged, and do not perform a production/Azure operation.
- Preserve the existing DILG chart payload and mobile document list behavior on successful requests.
- Test only local/synthetic data; do not use resident or production data.
- Existing application sources and task history are being inspected in isolated `/tmp` worktrees. Do not edit the primary checkout or its untracked `.agents/`, `.codex/`, `.aws/`, or supplied logo assets.
