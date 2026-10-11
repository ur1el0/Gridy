# Task Brief: Registration Mode Switch Accessible Name

## 1. Metadata
- **Task ID:** `m24-registration-mode-switch-accessible-name`
- **Task Type:** Accessibility improvement with regression test
- **Target:** Web registration header mode switch
- **Implementer / Reviewer:** Codex (user-directed sole-agent mode)
- **Branch / Base:** `fix/registration-mode-switch-accessible-name` / M23 checkpoint `2ccc39f`

## 2. Objective and Scope
- **Goal:** Make the header mode switch’s accessible name communicate both its visible current-mode label and the destination mode it activates.
- **Evidence:** M23 found Chrome AX reports `RESIDENT REGISTRATION ⇄` or `STAFF REGISTRATION ⇄`; the footer control names the switch destination explicitly. The header’s generic `title` is not part of its AX name.
- **Non-goals:** No visible copy/layout change, mode logic change, footer-control change, form behavior change, dependency, API, or backend modification.

## 3. Required Behavior
- In resident mode, the header switch name includes the visible “Resident Registration” label and says it switches to official registration.
- In official mode, the name includes the visible “Staff Registration” label and says it switches to resident registration.
- Preserve the visible label, native button semantics, keyboard behavior, and current mode toggle behavior.

## 4. Observable Acceptance Criteria
1. [x] Resident-mode header button exposes an accessible name including “Resident Registration” and “switch to official registration”.
2. [x] Official-mode header button exposes an accessible name including “Staff Registration” and “switch to resident registration”.
3. [x] Visible header text and its mode transition remain unchanged; the footer control is not modified.
4. [x] Focused page test, full frontend tests, lint, build, local Chrome AX check, and whitespace checks pass.
5. [x] Only the scoped header component, registration test, and M24 brief/plan are checkpointed; unrelated untracked files remain untouched.

## 5. Constraints
- Preserve visible text within the accessible name to support WCAG 2.5.3 Label in Name and voice-control matching.
- Follow `docs/ai-workflow/playbooks/IMPLEMENTATION.md`, the accessibility skill, and React Testing Library conventions.
- Do not alter account registration state transitions or submit any registration data.
