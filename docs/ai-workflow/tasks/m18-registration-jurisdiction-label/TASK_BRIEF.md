# Task Brief: Accessible Barangay Jurisdiction Selector

## 1. Metadata
- **Task ID:** `m18-registration-jurisdiction-label`
- **Task Type:** Accessibility bug fix with regression test
- **Target Component:** React registration form
- **Implementer / Reviewer:** Codex (temporary user-directed single-agent mode)
- **Branch:** `fix/registration-jurisdiction-label`
- **Base Commit:** `8273078` (M17 post-remediation audit)

## 2. Objective & Scope
- **Goal:** Associate the visible `LOCAL BARANGAY JURISDICTION` label with its required select so browsers and assistive technology expose a meaningful accessible name.
- **Non-goals:** No visual redesign, API/validation changes, unrelated registration changes, dependencies, data changes, deployment, push, or production work.
- **Evidence:** M17 browser audit A11Y-05 found Chrome's accessibility tree exposes the required selector as an unnamed `combobox`; `BarangaySelectField.tsx` has a visible label without `htmlFor` and a select without `id`.

## 3. Required Behavior
- Use a stable unique ID for the select and connect the existing visible label with `htmlFor`.
- Preserve the visible wording, required state, loading/empty disabled behavior, selected value, options, error message, styling, and change callback.
- Add a component regression test that queries the selector by the visible label and verifies its select behavior remains intact.

## 4. Acceptance Criteria
1. [x] `LOCAL BARANGAY JURISDICTION` is the programmatic accessible name of the required select.
2. [x] Selecting a barangay still invokes `onBarangayIdChange` with the selected ID; existing disabled and required behavior is preserved.
3. [x] A focused Vitest regression test passes; frontend lint, full tests, and production build pass.
4. [x] `git diff --check` passes and only the M18 component, test, brief, and plan are included in the local checkpoint. Unrelated untracked files remain untouched.

## 5. Files & Constraints
- `frontend/src/components/auth/register/BarangaySelectField.tsx`
- `frontend/src/components/auth/register/BarangaySelectField.test.tsx` (new)
- `docs/ai-workflow/tasks/m18-registration-jurisdiction-label/{TASK_BRIEF.md,PLAN.md,STATUS.md}`
- No tenant, RBAC, auth, API, persistence, or deployment behavior is in scope.
- Do not stage `.agents/`, `.codex/`, unrelated task files, or supplied logo JPEGs.
