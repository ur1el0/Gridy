# Registration Control Keyboard Activation Audit

- **Date:** 2026-10-10
- **Branch:** `audit/registration-keyboard-activation`
- **Base:** M22 checkpoint `44633f4`
- **Scope:** Keyboard focus and activation of the resident/official header switch, footer switch, and resident verification disclosure.
- **Method:** Read-only source review and isolated headless Chrome/CDP against local Vite on `/register`.

## Executive Summary

All three controls are native buttons with accessible button roles and names. Actual Chrome Tab navigation focused each control and exposed a visible focus ring. Enter and Space activated each button, updated the displayed mode or disclosure state, and retained focus. The disclosure’s accessibility tree exposed `expanded=false` while collapsed and `expanded=true` while open.

No keyboard activation defect was confirmed. The M20 limitation was resolved with a complete CDP Enter sequence: adding the Enter text value (`\r`) generated the browser `keypress` and trusted `click`; the earlier sequence without text generated keydown/keyup only. M20 did not preserve its exact event payload, so this audit cannot prove why that earlier attempt failed.

This focused check is not a screen-reader, physical-device, or full WCAG conformance assessment.

## Controls and Evidence

| Control | Source | Chrome AX name and role | Keyboard result |
|---|---|---|---|
| Header mode switch | `frontend/src/components/auth/register/RegisterHeroBanner.tsx#L35-L47` | `button`, `RESIDENT REGISTRATION ⇄` in resident mode; `STAFF REGISTRATION ⇄` in official mode | Tab focused it first from page start; Enter and Space each switched to official mode and back. Focus remained on the button. |
| Footer mode switch | `frontend/src/pages/auth/Register.tsx#L450-L464` | `button`, `Barangay Personnel? Switch to Official Registration` in resident mode; `Registering as a Resident? Switch to Resident Sign Up` in official mode | Tab reached it after 14 forward key presses from the focused header switch. Enter and Space each switched modes in both directions; focus remained on the button. |
| Verification disclosure | `frontend/src/components/auth/register/ResidentVerificationUploads.tsx#L44-L73` | `button`, accessible name includes “Identity & Residency Verification” and its current instruction | Tab reached it after 10 forward key presses from page start. Enter and Space each expanded and collapsed it. Chrome AX state changed `false` → `true` → `false`; proof fields mounted visibly when expanded. |

All three controls reported `:focus-visible=true` and a visible `1px` browser outline during keyboard focus. Chrome marked the resulting keyboard-generated click events as trusted with `detail=0`.

## Browser and Safety Evidence

- Local route: `http://127.0.0.1:5173/register`; document title: `KapitBayan`; page response: HTTP 200.
- Chrome DevTools `Accessibility.getFullAXTree` exposed the expected role/name for all controls; the disclosure tree reflected its collapsed and expanded values.
- Browser captured 84 requests across reloads; all were `GET`, all observed responses were HTTP 200, and there were 0 failed requests.
- Runtime exceptions: 0. Console warnings/errors: 0.
- No non-empty form values, checked consent boxes, or selected files were present at completion. No registration submission was initiated.
- The local public barangay directory was read via GET only; no records were changed.

## Findings

### Confirmed Defects

None in the scoped keyboard activation checks.

### Suggestions / Open Questions

- The header mode-switch button’s accessible name identifies the current mode (`RESIDENT REGISTRATION` or `STAFF REGISTRATION`) rather than the destination. The footer switch does name the destination. Consider an action-oriented accessible name for the header control in a separate focused improvement; this was not treated as a keyboard activation defect.
- Screen-reader speech, mobile viewport behavior, physical keyboards, and device-specific assistive technology remain unverified.

## Verification Summary

| Check | Result |
|---|---|
| Local Chrome keyboard audit | Pass; Tab, Enter, and Space verified on all three controls |
| Browser accessibility tree | Pass; button roles/names present and disclosure expanded state correct |
| Form/data safety | Pass; no values, selections, or registration submission |
| Browser health | Pass; 0 runtime exceptions, 0 console warnings/errors, 0 failed requests |
| Application source changes | None; audit remained read-only |
