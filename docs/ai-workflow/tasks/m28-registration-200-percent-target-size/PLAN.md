# Plan: Registration 200%-Equivalent Layout and Target-Size Audit

## 1. Overview

- **Task brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `audit/registration-200-percent-target-size`
- **Base:** M27 checkpoint `b27f5e5`
- **Complexity:** Low; read-only local browser audit.

## 2. Milestone 1: Inspect 200%-Equivalent Layout and Interactive Targets

- **Status:** Complete. No confirmed defects; measurements and limits are recorded in [AUDIT.md](AUDIT.md).

1. Review M14's remaining verification gaps and M27's conditional-state evidence.
2. Start local Vite and open `/register` in an isolated headless Chrome session.
3. Set a 640 CSS-pixel viewport and 2× device scale. Measure resident default, expanded verification, combined minor, and official registration states.
4. For each state, record viewport/client/scroll widths, visible content bounds, focusable elements outside the viewport, accessible names, and bounds for visible hit areas.
5. For checkbox and file inputs, measure their wrapping labels. Assess targets below 24 CSS pixels with the WCAG 2.2 spacing exception rather than treating the hidden/native input box as the entire target.
6. Save temporary screenshots outside the repository and visually inspect representative states for clipped text, overlap, or ambiguous hit areas.
7. Confirm only local GET requests occurred and no values, files, or forms were submitted. Record browser/runtime/network results.
8. Write `AUDIT.md` and ignored `STATUS.md`; review the documentation-only diff and checkpoint only M28 task files.

### Validation

- Local Vite page: `http://127.0.0.1:5173/register`
- Browser: isolated Chrome DevTools Protocol session
- Git hygiene: `git diff --check`, `git diff --cached --name-only`, and exact staged-path review

## 3. Risks and Limits

- A 640 CSS-pixel viewport at 2× device scale is a documented 200%-zoom proxy; it does not exercise the browser's zoom controls.
- Target bounds indicate clickable geometry, not observed motor or screen-reader usability.
- If a defect is found, record reproducible evidence and create a separate implementation milestone rather than editing source during this audit.
