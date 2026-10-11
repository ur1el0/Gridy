# Minor Registration Guardian Control Audit

- **Date:** 2026-10-10
- **Branch:** `audit/registration-minor-guardian-fields`
- **Base:** M25 checkpoint `8d3e1da`
- **Scope:** Conditional guardian notice and username field for residents under 18, including its age-18 boundary and 320-pixel layout.
- **Method:** Read-only source review and isolated local Chrome/CDP at `http://127.0.0.1:5173/register`; only synthetic birth dates were used to reveal the conditional UI.

## Executive Summary

The minor-only path rendered as expected. A synthetic date one day before the 18th birthday showed the guardian notice and a textbox with an associated visible label. The DOM and Chrome accessibility tree both exposed the textbox as required. On the 18th birthday, the notice and field were removed from the DOM and accessibility tree. At 320 CSS pixels, the notice and input stayed within the viewport with no horizontal document overflow.

No defect was confirmed in the scoped conditional state. No account submission or persistent data change occurred.

## State and Semantics Evidence

The app calculates age in `frontend/src/pages/auth/Register.tsx#L71-L82` and conditionally renders the guardian notice/field at `#L350-L369`. The shared `TextField` associates its label and input with a generated ID in `frontend/src/components/ui/TextField.tsx#L17-L34`.

| Synthetic date | Age on 2026-10-10 | Guardian block | AX / DOM state |
|---|---:|---|---|
| `2008-10-11` | 17 (one day before 18th birthday) | Visible | Label `GUARDIAN'S REGISTERED USERNAME *` is associated; Chrome AX role `textbox`, same accessible name, `required=true`; DOM `validity.valueMissing=true` and `checkValidity()=false` while empty. |
| `2008-10-10` | 18 (18th birthday) | Removed | Guardian notice and textbox absent from DOM and AX tree. |
| Cleared | No date | Removed | Test state restored to empty before browser shutdown. |

At age 17, Chrome AX reported `invalid=false` while DOM constraint validation returned `checkValidity()=false`; it did expose `required=true`. No form-validation attempt was triggered, so this audit makes no claim about post-validation invalid announcements.

## 320-Pixel Reflow Evidence

- `window.innerWidth=320`, `documentElement.clientWidth=305`, and `scrollWidth=305`; no horizontal overflow.
- Guardian panel bounds: x=24–281. Guardian input bounds: x=41–264. Both remain inside the viewport.
- The temporary screenshot `/tmp/kapitbayan-m26-guardian-320.png` was visually inspected and is not in the repository. The warning copy wraps, and the required username input remains visible within its bordered notice.

## Browser and Safety Evidence

- Browser captured 42 requests across the check; all were `GET`, all observed responses were HTTP 200, and four requests targeted the public barangay directory.
- Runtime exceptions: 0. Console warnings/errors: 0. Failed requests: 0.
- Only the synthetic date field was temporarily populated. Other form values remained empty, no consent box was checked, and no file was selected.
- No registration submission was initiated. The date was cleared before ending the browser session.

## Findings

### Confirmed Defects

None found in the under-18 notice/field's conditional rendering, accessible label/name, required state, or 320-pixel layout.

### Limits

- The audit used synthetic UI state and CDP-generated date changes, not a physical keyboard/date picker.
- No registration validation/submission was triggered; no screen-reader speech or device behavior was tested.

## Verification Summary

| Check | Result |
|---|---|
| Under-18 conditional UI | Pass; notice and labeled guardian textbox visible at age 17 |
| Required state | Pass; DOM and Chrome AX both exposed `required=true` |
| Age-18 boundary | Pass; notice and field absent on 18th birthday |
| 320 CSS-pixel layout | Pass; no horizontal overflow; control bounds inside viewport |
| Browser health and data safety | Pass; only GET requests, no errors, values cleared, no submission |
| Application source changes | None; audit remained read-only |
