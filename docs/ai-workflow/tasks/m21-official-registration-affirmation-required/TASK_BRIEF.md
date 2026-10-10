# Task Brief: Expose the Required Official Registration Affirmation

## 1. Metadata
- **Task ID:** `m21-official-registration-affirmation-required`
- **Task Type:** Accessibility bug fix with regression test
- **Target:** Official registration checkbox
- **Implementer / Reviewer:** Codex (user-directed single-agent mode)
- **Branch / Base:** `fix/official-registration-affirmation-required` / `1adaeb2`

## 2. Objective and Scope
- **Goal:** Expose the official affirmation checkbox's existing mandatory status through native form semantics and a user-facing regression test.
- **Non-goals:** Do not change the affirmation copy, registration API/payload, passkey behavior, account-creation gating, visual design, unrelated registration controls, dependencies, deployment, or production data.
- **Evidence:** M20 found `AdminCredentialsSection.tsx` renders the unchecked checkbox without `required`; `Register.tsx` rejects `affirmation=false` and disables account creation until affirmation and passkey are provided. Chrome exposed the checkbox as unchecked without invalid/required state.

## 3. Required Behavior
- Add the native `required` attribute to the official affirmation checkbox.
- Preserve its existing accessible name, checked-state callback, and the parent's disabled-submit and validation guards.
- Add a regression assertion using an accessible query for the official checkbox and verify it is required.

## 4. Acceptance Criteria
1. [x] The official affirmation checkbox is exposed as required in the rendered form and Chrome AX reports it invalid while unchecked.
2. [x] The test queries it by accessible role/name and was confirmed red before the fix.
3. [x] Official mode and disabled-submit gating remain unchanged.
4. [x] Focused registration tests, full frontend tests, lint, build, and whitespace checks pass.
5. [x] Only the two application files and M21 task brief/plan are included in the checkpoint; unrelated untracked files remain untouched.

## 5. Constraints
- Follow the implementation playbook and React Testing Library conventions.
- Keep the change to the native required state and regression test.
- No account creation, API submission, push, deployment, or production interaction.
