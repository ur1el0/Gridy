# Plan: Registration Mode Switch Accessible Name

## 1. Overview
- **Task brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `fix/registration-mode-switch-accessible-name`
- **Base:** `2ccc39f`
- **Complexity:** Low

## 2. Milestone 1: Add Explicit Mode-Change Context
1. Add/update the registration page test to query the header control by its expected resident-mode accessible name and verify its official-mode name after switching.
2. Run the focused test and confirm it fails because the current accessible name lacks the destination action.
3. Add a mode-dependent `aria-label` to the header button. Include the currently visible mode text and the destination action; retain all existing visible text and event behavior.
4. Run the focused registration test, frontend lint, full frontend tests, and production build.
5. Recheck both button names in Chrome’s local accessibility tree after switching modes; verify keyboard activation and visible copy are unchanged.
6. Review the exact diff, update ignored `STATUS.md`, and checkpoint only the M24 component/test/brief/plan.

### Validation commands
```bash
npm --prefix frontend run test -- src/pages/auth/Register.test.tsx
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
git diff --check
```

Local browser recheck: Vite on `127.0.0.1:5173`, isolated headless Chrome/CDP on `/register`.

## 3. Risks and Rollback
- An `aria-label` that omits visible words can break label-in-name matching; the test must assert both the visible text and action phrase.
- Keep the change limited to the header control; the footer already has a destination-specific accessible name.
