# Plan: Registration Control Keyboard Activation Audit

## 1. Overview
- **Task brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `audit/registration-keyboard-activation`
- **Base:** `44633f4`
- **Complexity:** Low; focused local browser audit.

## 2. Milestone 1: Verify Keyboard Operation
1. Read the M20 audit and current source/tests for the header mode switch, footer mode switch, and disclosure.
2. Start Vite on loopback and load `/register` in isolated headless Chrome.
3. Enable Chrome accessibility, runtime, console, and network reporting through CDP.
4. Use actual CDP Tab key events to focus each of the three native buttons; record its AX role/name, focused element, and visible focus indication.
5. Activate both mode switches and the disclosure with Enter and Space, checking mode heading, `aria-expanded`, panel visibility, and focus retention after each activation.
6. Confirm no form field values, file selections, or submissions occurred; record any runtime, console, or network errors.
7. Write `AUDIT.md` and ignored `STATUS.md`, review the exact documentation diff, and checkpoint only M23 brief, plan, and audit report.

### Validation
- Local Chrome DevTools Protocol against `http://127.0.0.1:5173/register`.
- `git diff --check` and exact staged-path review.

## 3. Risks and Limits
- CDP key events may not represent every physical keyboard/OS combination; document the exact key-event method.
- Local rendering does not verify screen-reader speech, mobile keyboards, or physical-device behavior.
- No app code is changed in this read-only milestone; any confirmed defect becomes a separately scoped fix.
