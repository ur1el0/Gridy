# Audit: Registration Conditional-State Reflow

- **Date:** 2026-10-10
- **Branch:** `audit/registration-conditional-reflow-states`
- **Base:** M26 checkpoint `d6bf737`
- **Scope:** Resident registration's expanded identity/residency proof section, under-18 guardian notice, their combined state, and official registration controls at narrow CSS viewport widths.
- **Method:** Read-only source inspection and isolated headless Chrome/CDP against local Vite at `http://127.0.0.1:5173/register`; screenshots were saved under `/tmp` and visually inspected.

## Executive Summary

The conditional layouts reflowed at 320 CSS pixels and the supplemental 375-pixel viewport. No horizontal document overflow, overlap, or visible focusable control outside the content viewport was observed. The disclosure exposes its expanded state; the guardian textbox and official passkey/affirmation controls retain their names and required semantics.

No confirmed defect was found in the scoped conditional states. A long selected residency-proof option is visually shortened inside the narrow native select, which is recorded as a non-blocking observation rather than a reflow defect. This focused audit does not certify the complete registration page against WCAG.

## Layout Evidence

`innerWidth` is the emulated CSS viewport. `clientWidth` is 15 pixels narrower because the page has a vertical scrollbar; `scrollWidth` matched `clientWidth` in every measured state.

| State | Width | Client / scroll width | Visible focusables | Outside viewport | Conditional bounds |
|---|---:|---:|---:|---:|---|
| Resident default | 320 | 305 / 305 | 14 | 0 | Disclosure `x=24–281` |
| Verification expanded | 320 | 305 / 305 | 20 | 0 | Section `x=24–281`, `y=706–1423` |
| Under-18 guardian only | 320 | 305 / 305 | 15 | 0 | Guardian panel `x=24–281`, `y=817–1037` |
| Verification + under-18 guardian | 320 | 305 / 305 | 21 | 0 | Guardian panel `x=24–281`, `y=1439–1660`; textbox `x=41–264` |
| Official registration | 320 | 305 / 305 | 13 | 0 | Passkey `x=24–281`; all controls within viewport |
| Resident default | 375 | 360 / 360 | 14 | 0 | No horizontal overflow |
| Verification expanded | 375 | 360 / 360 | 20 | 0 | No horizontal overflow |
| Verification + under-18 guardian | 375 | 360 / 360 | 21 | 0 | Guardian panel `x=24–336` |
| Official registration | 375 | 360 / 360 | 13 | 0 | Passkey `x=24–336`; no horizontal overflow |

The 320-pixel screenshots were visually inspected:

- `/tmp/m27-registration-resident-default-320.png` (320 × 1345)
- `/tmp/m27-registration-verification-expanded-320.png` (320 × 1968)
- `/tmp/m27-registration-minor-guardian-only-320.png` (320 × 1582)
- `/tmp/m27-registration-minor-and-verification-expanded-320.png` (320 × 2204)
- `/tmp/m27-registration-official-registration-320.png` (320 × 1155)

Labels, proof cards, guardian copy, official affirmation copy, buttons, and links wrapped vertically and remained within the page. The long selected value `Electric Bill (Meralco/Quezelco)` appears shortened in the closed native select at 320 pixels; the select itself stays within the viewport. The native option list was not opened in this audit, so its expanded rendering is unverified.

## Conditional State and Accessibility Evidence

- A synthetic birth date of `2008-10-11` represented age 17 on the audit date (`2026-10-10`, Asia/Manila). The guardian panel appeared; its visible label was `GUARDIAN'S REGISTERED USERNAME *`, the control was required in the DOM, and Chrome's accessibility tree exposed it as a required textbox with the same name.
- Clearing the date removed the guardian panel. The temporary date was cleared before ending the browser session.
- The verification control was exposed as a named button with `expanded=false`; after opening it, Chrome exposed `expanded=true` and the button's visible instruction changed to “Tap to collapse verification documents.”
- In official mode, the passkey was a required textbox named `LGU ADMINISTRATIVE PASSKEY`. The affirmation was a named checkbox; its DOM `required` state was `true` and its unchecked state was exposed in the accessibility tree.
- The resident and official mode-switch buttons had descriptive names in Chrome's accessibility tree.

Source context: age calculation and conditional state are in `frontend/src/pages/auth/Register.tsx#L71-L82`, resident conditional content in `#L327-L369`, and official credentials inclusion in `#L421-L429`. The disclosure state is implemented in `frontend/src/components/auth/register/ResidentVerificationUploads.tsx#L48-L69`; required official controls are in `frontend/src/components/auth/register/AdminCredentialsSection.tsx#L20-L43`.

## Browser and Safety Evidence

- Local route loaded with title `KapitBayan`.
- The captured navigation generated 41 requests: all 41 used `GET` and returned HTTP 200. This included two `GET` requests to the local public barangay directory endpoint. No non-GET request or failed request was observed.
- Runtime exceptions: 0. Console warnings/errors: 0.
- No names, emails, passwords, passkeys, files, or consent values were entered. No form submission was attempted. Only the synthetic date and local UI toggles were used; the date was cleared before shutdown.
- Browser inspection used an isolated headless Chrome profile. The Chrome DevTools MCP target was unavailable, so local Chrome was controlled through its localhost DevTools protocol endpoint.

## Findings

### Confirmed Defects

None found in the tested conditional layouts, viewport bounds, or inspected accessible names and states.

### Suggestions and Limits

- **Low, non-blocking observation:** At 320 pixels, the closed native residency-proof select visually shortens its long selected option text. No horizontal overflow or loss of the control was observed. Consider a shorter visible option label only if users cannot distinguish choices in practice; this audit did not open the native option list.
- CSS viewport emulation checks the 320 CSS-pixel reflow target but does not exercise browser zoom controls, physical devices, or screen-reader speech.
- No full-page automated axe scan or complete WCAG review was performed.

## Finding Counts

| Severity | Confirmed defects |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total confirmed defects** | **0** |

## Verification Summary

| Check | Result |
|---|---|
| Conditional states at 320 CSS pixels | Pass; all tested states had matching client/scroll widths and no focusable controls outside the viewport |
| Supplemental 375 CSS-pixel checks | Pass; resident default, expanded verification, combined minor, and official mode had no horizontal overflow |
| Chrome accessibility tree and DOM required state | Pass for the inspected disclosure, guardian textbox, mode switch, passkey, and affirmation controls |
| Temporary screenshot inspection | Pass; five 320-pixel screenshots visually inspected; artifacts remain in `/tmp` |
| Browser/network health | Pass; 41 GET requests, all HTTP 200; 0 runtime exceptions, 0 console warnings/errors |
| Form/data safety | Pass; no form submission, file selection, or persistent data mutation; synthetic date cleared |
| Application source changes | None; audit remained read-only |
