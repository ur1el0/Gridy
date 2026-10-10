# Plan: Registration Reflow Accessibility Audit

## 1. Overview
- **Task brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `audit/registration-reflow-320css`
- **Base:** `a8d194e`
- **Complexity:** Low; focused local browser audit.

## 2. Milestone 1: Inspect Narrow-Width Reflow
1. Review the M20 audit and registration layout/component styles.
2. Start local Vite and load `/register` in isolated headless Chrome.
3. Inspect at 1280 CSS pixels and 320 CSS pixels. At each width record `innerWidth`, document/body scroll widths, visible headings, control bounds, and AX names for key controls.
4. Capture a temporary 320-pixel screenshot for visual inspection; store it outside the repository.
5. Inspect for horizontal page scrolling, clipped labels/buttons, overlapping text, missing content, and controls outside the viewport; record any finding with evidence.
6. Confirm no form values/files/submission, and capture console/runtime/network errors.
7. Write `AUDIT.md` and ignored `STATUS.md`, review the exact documentation diff, and checkpoint only M25 brief/plan/report.

### Validation
- Chrome DevTools Protocol and temporary screenshot against `http://127.0.0.1:5173/register`.
- `git diff --check` and exact staged-path review.

## 3. Risks and Limits
- Chrome viewport emulation tests CSS reflow but does not exercise the desktop browser's zoom UI; state this limit explicitly.
- Local public directory fetches may occur; record their actual methods/statuses and do not mutate data.
- No complete WCAG conformance or physical-device claim is in scope.
