# Browser Recheck: Registration Jurisdiction Label

- **Date:** 2026-10-10
- **Branch:** `audit/registration-jurisdiction-browser-recheck`
- **Base:** M18 implementation checkpoint `63ab04a`
- **Scope:** Read-only local browser verification of the M18 fix for M17 finding A11Y-05.
- **Method:** Vite on loopback and isolated headless Chrome 155 controlled through Chrome DevTools Protocol. No account creation, form data entry, or form submission.

## Executive Summary

The M18 label fix is confirmed in the running registration page. Chrome's accessibility tree exposes the required jurisdiction select as a combobox named **LOCAL BARANGAY JURISDICTION**. Actual Tab key events reach it, and the keyboard-focused control displays a blue border in the captured local screenshot. The page and its local scripts and barangay-directory requests loaded successfully; no browser console errors, JavaScript exceptions, or failed requests were observed.

This is a focused recheck of A11Y-05 and the selector's keyboard focus. It is not a full WCAG audit or a screen-reader/device test.

## Finding Follow-up

| Finding | Status | Evidence |
|---|---|---|
| M17 A11Y-05 — required barangay selector has no accessible name | **Resolved; browser verified** | The rendered label has `htmlFor="_r_7_"`; its select has matching `id="_r_7_"`, `required=true`, and `disabled=false`. Chrome AX tree reports `role=combobox`, `name=LOCAL BARANGAY JURISDICTION`. Keyboard Tab reached the select with `:focus-visible=true`; screenshot and computed style show the visible `rgb(2, 132, 199)` focus border. |

## Browser Evidence

- Local page: `http://127.0.0.1:5173/register`; document title: `KapitBayan`; response: HTTP 200.
- The label's `htmlFor` and select's `id` both resolved to `_r_7_`; `select.labels` contained the visible jurisdiction label.
- The required select was enabled and contained the placeholder plus four local barangay options.
- `Accessibility.getFullAXTree` returned the select as a `combobox` named `LOCAL BARANGAY JURISDICTION`.
- Real CDP Tab key events from the page's initial body focus moved through the registration controls and reached the barangay select. At the select, `:focus-visible` was true and the rendered 1px border was `rgb(2, 132, 199)` on a white background. Temporary screenshot: `/tmp/m19-registration-focus.png` (not committed).
- The registration document, Vite client, application modules, and both `GET /api/v1/auth/public/barangays/` responses returned HTTP 200. No failed requests, console errors/warnings, or uncaught JavaScript exceptions were observed during the reload and check.
- No form fields were populated and no form or API mutation was submitted.

## Verification Results

| Check | Method | Result |
|---|---|---|
| Local registration page | `curl` to `http://127.0.0.1:5173/register` | HTTP 200, `text/html` |
| Accessible name and required state | Chrome CDP `Accessibility.getFullAXTree` plus DOM inspection | `combobox`, name `LOCAL BARANGAY JURISDICTION`, required and enabled |
| Keyboard reachability / focus | Chrome CDP `Input.dispatchKeyEvent` Tab sequence and computed styles | Reached selector; `:focus-visible=true`; visible blue border confirmed in `/tmp` screenshot |
| Local browser health | CDP console, exception, failed-request, and response events | 0 console errors/warnings, 0 exceptions, 0 failed requests; relevant local responses 200 |
| Repository whitespace | `git diff --cached --check` | Clean (exit 0) for the exact three-file audit checkpoint |

## Limitations and Residual Risks

- No screen reader or physical device was used; spoken output and platform accessibility behavior remain unverified.
- No axe-core scan or full-page WCAG conformance audit was performed.
- The audit confirms the control is named, required, enabled with loaded options, keyboard reachable, and visibly focused in this local browser state. It does not establish conformance for every registration state, viewport, browser, or operating system.
- No new defect was found within this milestone's focused scope.
