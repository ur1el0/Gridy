# Plan: Registration Conditional-State Reflow Audit

## 1. Overview

- **Task brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `audit/registration-conditional-reflow-states`
- **Base:** `d6bf737`
- **Complexity:** Low; read-only local browser audit.

## 2. Milestone 1: Inspect Conditional Layouts at Narrow Widths

1. Review the M25 and M26 reports, registration age calculation, and conditional UI components.
2. Start local Vite and open `/register` in an isolated headless Chrome context.
3. At 320 CSS pixels, record resident default, expanded verification, under-18 guardian, combined expanded-plus-guardian, and official mode states. Repeat key width/overflow measurements at 375 pixels.
4. For each state, record `innerWidth`, document client/scroll widths, visible focusable control bounds, and conditional-region bounds. Inspect Chrome's accessibility tree for the mode toggle, disclosure state, guardian field, and official controls.
5. Capture temporary screenshots of expanded verification, combined minor, and official states outside the repository and visually inspect wrapping, overlap, clipping, and horizontal scrolling.
6. Confirm only the synthetic birth date and UI toggles were used; no file, form submission, or non-GET request occurs. Record browser/runtime/network results.
7. Write `AUDIT.md` and ignored `STATUS.md`; review the documentation-only diff and checkpoint only M27 task files.

### Validation

- Local Vite page: `http://127.0.0.1:5173/register`
- Browser: isolated Chrome DevTools Protocol session
- Git hygiene: `git diff --check`, `git diff --cached --name-only`, and exact staged-path review

## 3. Risks and Limits

- Reflow width emulation is a proxy for zoom reflow; browser zoom UI itself is not part of this audit.
- The app may issue read-only public directory GET requests; document observed requests rather than assuming behavior.
- If a layout defect is found, record reproducible evidence and create a separate implementation task instead of editing source in this audit.
