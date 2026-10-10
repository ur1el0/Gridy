# Plan: Minor Registration Guardian Control Audit

## 1. Overview
- **Task brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `audit/registration-minor-guardian-fields`
- **Base:** `8d3e1da`
- **Complexity:** Low; focused local browser audit.

## 2. Milestone 1: Inspect Conditional Guardian State
1. Review the M20 limitation, age calculation, conditional rendering, and shared `TextField` labeling behavior.
2. Start local Vite and isolated Chrome; load `/register` and enable AX/runtime/network reporting.
3. At 320 CSS pixels, set only the date input to `2008-10-11` through local CDP input events. Inspect visible guardian notice, associated label, required/invalid DOM state, textbox AX name/role, and layout bounds.
4. Change only the date to `2008-10-10` and verify the guardian block/field is absent; restore `2008-10-11` and verify it returns.
5. Confirm no other values or files, no submission, no mutating HTTP method, and no browser errors.
6. Write `AUDIT.md` and ignored `STATUS.md`, review the exact documentation diff, and checkpoint only M26 brief/plan/report.

### Validation
- Local Chrome DevTools Protocol at `http://127.0.0.1:5173/register`.
- `git diff --check` and exact staged-path review.

## 3. Risks and Limits
- The app uses the host browser date; the selected test values are fixed for the recorded audit date, 2026-10-10.
- CDP date-input state changes exercise local React rendering but do not represent physical keyboard/date-picker operation.
- No registration submission or backend write is in scope.
