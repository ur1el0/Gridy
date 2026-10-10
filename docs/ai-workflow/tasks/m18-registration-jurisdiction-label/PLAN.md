# Implementation Plan: Accessible Barangay Jurisdiction Selector

## 1. Plan Overview
- **Associated Brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target Branch:** `fix/registration-jurisdiction-label`
- **Base:** `8273078`
- **Complexity:** Low; one focused bug fix.

## 2. Milestone 1: Associate the Visible Label
- **Objective:** Give the required barangay select the accessible name visible beside it while retaining current form behavior.
- **Actions:**
  1. Create a stable per-instance ID with React `useId()` in `BarangaySelectField`.
  2. Connect the label through `htmlFor` and put the matching ID on the `<select>`.
  3. Add a component test that finds the select by `LOCAL BARANGAY JURISDICTION`, confirms `required`, and selects a provided barangay to verify the callback.
  4. Run focused test, frontend lint, full frontend tests, production build, and `git diff --check`; log actual outcomes in ignored `STATUS.md`.
  5. Review and stage only the M18 component, new test, and task brief/plan before the local checkpoint.
- **Validation commands:**
  ```bash
  npm --prefix frontend run test -- src/components/auth/register/BarangaySelectField.test.tsx
  npm --prefix frontend run lint
  npm --prefix frontend run test
  npm --prefix frontend run build
  git diff --check
  ```
- **Expected outcome:** The browser-visible label names the required select, current interaction behavior is unchanged, and all frontend checks pass.

## 3. Risks & Rollback
- **Risk:** Multiple copies of the registration form could otherwise duplicate a hard-coded DOM ID. `useId()` avoids that.
- **Rollback:** Revert only this focused local checkpoint if a regression appears.

## 4. Decisions
- Keep the existing visible label and markup layout; use native label/select association rather than a separate ARIA label.
