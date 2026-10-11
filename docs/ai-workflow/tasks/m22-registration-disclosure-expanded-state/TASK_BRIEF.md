# Task Brief: Expose Registration Verification Disclosure State

## 1. Metadata
- **Task ID:** `m22-registration-disclosure-expanded-state`
- **Task Type:** Accessibility improvement with regression test
- **Target:** Resident verification disclosure
- **Implementer / Reviewer:** Codex (user-directed single-agent mode)
- **Branch / Base:** `fix/registration-verification-disclosure-state` / M21 checkpoint `6e31558`

## 2. Objective and Scope
- **Goal:** Expose the existing collapsed/expanded state of the registration verification disclosure as a programmatic button state.
- **Evidence:** M20 found the disclosure button changes its visible instruction but Chrome's AX tree had no expanded-state property.
- **Non-goals:** No layout or copy changes, verification-field changes, upload behavior changes, persistent panel mounting, `aria-controls` reference to a conditional element, or unrelated registration changes.

## 3. Required Behavior
- Set `aria-expanded` on the existing disclosure button from the `isExpanded` prop.
- Preserve the existing callback, visible state-specific instruction, and conditional mount/unmount of the panel.
- Test the collapsed and expanded values and confirm the button still invokes its toggle callback.

## 4. Acceptance Criteria
1. [x] Collapsed state exposes `aria-expanded="false"`.
2. [x] Expanded state exposes `aria-expanded="true"` and existing panel content remains visible; Chrome AX reports the expanded state.
3. [x] Clicking the button still calls `onToggleExpand`.
4. [x] Focused component/page tests, full frontend tests, lint, build, and whitespace checks pass.
5. [x] Only the component, focused test, and M22 brief/plan are checkpointed; unrelated untracked files remain untouched.

## 5. Constraint and Decision
- Follow the implementation playbook and React Testing Library conventions.
- Keep the panel conditionally mounted as today. Do not add `aria-controls` while the referenced panel is absent in the collapsed state; changing panel lifetime is outside this task.
- No user data, file selection, registration submission, push, deployment, or production interaction.
