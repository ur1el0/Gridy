# Registration Reflow Accessibility Audit

- **Date:** 2026-10-10
- **Branch:** `audit/registration-reflow-320css`
- **Base:** M24 checkpoint `a8d194e`
- **Scope:** Resident `/register` layout, page widths, visible controls, and key AX names at 1280 and 320 CSS-pixel viewports.
- **Method:** Isolated headless Chrome/CDP with Vite serving the local app; temporary full-page screenshot at 320 CSS pixels.

## Executive Summary

No horizontal page overflow, clipped focusable controls, or content extending beyond the viewport was found at either tested width. At 320 CSS pixels, the registration layout stacks vertically, labels and controls wrap within the page, and the header switch, verification disclosure, and submit button remain within the content width. This verifies the 320 CSS-pixel reflow width, which corresponds to the WCAG 1.4.10 target for a 1280 CSS-pixel viewport at 400% zoom. Chrome's browser UI zoom control was not exercised.

This focused audit does not certify the full page against WCAG and does not test a physical mobile device or screen reader.

## Layout Evidence

| Measure | 1280 CSS-pixel reference | 320 CSS-pixel reflow viewport |
|---|---:|---:|
| `window.innerWidth` | 1280 | 320 |
| `documentElement.clientWidth` | 1265 | 305 |
| `documentElement.scrollWidth` | 1265 | 305 |
| Horizontal document overflow | No | No |
| Visible focusable controls | 13 | 13 |
| Focusable controls outside viewport horizontally | 0 | 0 |
| Document scroll height | 1109 | 1345 |

The 15-pixel difference between `innerWidth` and `clientWidth` is the vertical scrollbar; the document scroll width equals the client width at both sizes. At 320 pixels, the mode button bounds were x=116–285, the verification disclosure x=25–280, and the create-account button x=24–281. All remain within the 305-pixel content viewport.

The temporary full-page screenshot `/tmp/kapitbayan-m25-registration-320.png` was visually inspected and is not in the repository. The page stacks its banner and registration form, wraps the verification prompt and footer switch onto additional lines, and keeps visible labels, inputs, consent text, and actions within the viewport.

## Accessibility and Safety Evidence

- Chrome's AX tree exposed the mode switch as a named button, the verification disclosure as a named button with `expanded=false`, and the create-account action as a button.
- At 320 pixels, the controls' bounds and names remained present; no horizontal clipping was observed.
- The local page loaded with document title `KapitBayan`.
- The browser captured 84 requests across two page reloads; every request was `GET` and every observed response was HTTP 200. The local public barangay directory requests were GETs only.
- Runtime exceptions: 0. Console warnings/errors: 0. Failed requests: 0.
- No form values were entered, no consent box was checked, no files were selected, and no registration was submitted.

## Findings

### Confirmed Defects

None found in the tested widths and resident default state.

### Suggestions and Limits

- The tested 320 CSS-pixel width is a reflow-width proxy for 400% zoom from 1280 CSS pixels; actual browser zoom UI was not exercised.
- Official registration mode, expanded disclosure contents, 200% zoom, landscape orientation, assistive technology speech, and physical-device rendering were outside this audit.

## Source Context

- `frontend/src/pages/auth/Register.tsx#L222-L236` uses a column layout that becomes a row at the `md` breakpoint and constrains the form to the available width with responsive padding.
- `frontend/src/components/auth/register/RegisterHeroBanner.tsx#L30-L50` keeps the brand and mode switch together in a wrapping responsive container.
- `frontend/src/components/auth/register/ResidentVerificationUploads.tsx#L44-L73` preserves a native disclosure button and conditionally rendered panel.

## Verification Summary

| Check | Result |
|---|---|
| Local 1280 and 320 CSS-pixel viewports | Pass; no horizontal document overflow |
| Horizontal bounds for focusable controls | Pass; none extend beyond the viewport |
| 320-pixel screenshot and visual inspection | Pass; wrapped content and controls remain visible |
| Browser health | Pass; 0 runtime exceptions, console warnings/errors, or failed requests |
| Form/data safety | Pass; no values, files, or submission |
| Application source changes | None; audit remained read-only |
