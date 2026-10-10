# Plan: Expose Registration Verification Disclosure State

## 1. Overview
- **Task brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `fix/registration-verification-disclosure-state`
- **Base:** `6e31558`
- **Complexity:** Low

## 2. Milestone 1: Add and Verify Expanded State
1. Add a test for the collapsed button state, callback, and expanded state after the parent updates the `isExpanded` prop.
2. Run the focused test and confirm it fails because the expanded property is missing.
3. Add `aria-expanded={isExpanded}` to the existing disclosure button.
4. Run the focused component test, registration-page tests, frontend lint, full frontend tests, production build, and whitespace checks.
5. Recheck the collapsed and expanded state in Chrome's local accessibility tree using the registration page; only the disclosure is clicked, no form data is entered.
6. Review the exact diff, update ignored `STATUS.md`, and checkpoint only the M22 component/test/brief/plan.

### Validation commands
```bash
npm --prefix frontend run test -- src/components/auth/register/ResidentVerificationUploads.test.tsx
npm --prefix frontend run test -- src/pages/auth/Register.test.tsx
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
git diff --check
```

Local browser recheck: Vite on `127.0.0.1:5173` with isolated headless Chrome/CDP against `/register`.

## 3. Risks and Rollback
- Adding `aria-expanded` reflects state already controlled by the parent and does not change behavior.
- Do not keep hidden inputs mounted when collapsed; that would change current component lifecycle and is not needed for the explicit state property.
