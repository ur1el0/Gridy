# Plan: Expose the Required Official Registration Affirmation

## 1. Overview
- **Task brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `fix/official-registration-affirmation-required`
- **Base:** `1adaeb2`
- **Complexity:** Low

## 2. Milestone 1: Native Required State and Regression Coverage
1. Add an assertion to the official-mode test in `Register.test.tsx` using `getByRole('checkbox', {name: /I affirm.../})` and `toBeRequired()`.
2. Run the focused registration test and confirm it fails for the missing required state.
3. Set `required` on the official affirmation checkbox in `AdminCredentialsSection.tsx`.
4. Re-run the focused test, then full frontend tests, lint, production build, and whitespace checks.
5. Recheck the official checkbox's unchecked/required state and disabled submit button in the local Chrome AX tree, without entering data or submitting the form.
6. Inspect the source/test diff, record actual command and browser results in ignored `STATUS.md`, and checkpoint only M21 files.

### Validation commands
```bash
npm --prefix frontend run test -- src/pages/auth/Register.test.tsx
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
git diff --check
```

Local browser recheck: Vite on `127.0.0.1:5173` with isolated headless Chrome/CDP against `/register`.

## 3. Risks and Rollback
- The checkbox already gates registration, so the native required attribute should expose existing behavior without changing business rules.
- If browser validation changes submission behavior unexpectedly, record the evidence and update the plan before widening the change.
- Roll back only this checkpoint if verification exposes a regression.
