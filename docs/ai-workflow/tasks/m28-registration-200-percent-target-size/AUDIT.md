# Registration 200%-Equivalent Layout and Target-Size Audit

## 1. Metadata

- **Task ID:** `m28-registration-200-percent-target-size`
- **Branch:** `audit/registration-200-percent-target-size`
- **Base:** M27 checkpoint `b27f5e5`
- **Audit date:** 2026-10-10
- **Type:** Read-only accessibility and responsive-layout audit

## 2. Summary

No confirmed layout or target-spacing defect was found in the four tested registration states. All layouts fit the 640 CSS-pixel viewport without horizontal document overflow, and all measured small targets had sufficient separation for the WCAG 2.2 2.5.8 spacing exception. The closest case was the inline “Apply for DILG review” link, whose 24 CSS-pixel diameter spacing circle cleared the barangay selector by approximately 3.5 CSS pixels.

This was a focused browser audit. It does not establish full WCAG conformance, physical-device usability, or assistive-technology usability.

## 3. Method and Environment

- Served the frontend locally at `http://127.0.0.1:5173/register` using Vite and inspected it in an isolated headless Google Chrome 155 session.
- Emulated a 640 CSS-pixel viewport at device scale factor 2 as a layout and rendering proxy for 200% zoom from a 1280 CSS-pixel viewport. Browser zoom controls themselves were not used.
- Inspected resident default, expanded identity/residency verification, a synthetic under-18 state combined with expanded verification, and official registration.
- Captured full-page screenshots under `/tmp` and visually inspected them for clipping, overlap, text wrapping, and visible control affordances.
- Measured the clickable label wrapping each visually hidden file input, and the visible labels wrapping the privacy and official affirmation checkboxes.
- Inspected Chrome's accessibility tree and the corresponding DOM required/expanded states.
- No account data was entered, no file was selected, and no registration form was submitted. A synthetic birth date was used only to expose the guardian condition; the page was reloaded afterward, leaving the date blank and zero selected files.

## 4. Layout Results

At the emulated 640 CSS-pixel viewport, Chrome reported a 625 CSS-pixel document client width because the vertical scrollbar occupied 15 pixels. The document scroll width and body scroll width were also 625 pixels in every state. No focusable element extended beyond the horizontal viewport.

| State | Visible focusable elements | Client / scroll width | Focusables outside horizontal bounds | Result |
|---|---:|---:|---:|---|
| Resident default | 14 | 625 / 625 | 0 | Pass |
| Expanded verification | 20 | 625 / 625 | 0 | Pass |
| Under-18 guardian + expanded verification | 21 | 625 / 625 | 0 | Pass |
| Official registration | 13 | 625 / 625 | 0 | Pass |

Visual inspection found no text clipping, control overlap, or content extending horizontally beyond the page. Long forms remain vertically scrollable as expected.

## 5. Target Bounds and Spacing

Dimensions are CSS pixels at the emulated viewport. For controls under 24 × 24 CSS pixels, spacing was assessed by checking whether a 24-pixel diameter circle centered on the target would intersect another target.

| Target | State | Measured bounds (width × height) | Nearest relevant target / spacing result |
|---|---|---:|---|
| Header registration-mode switch | Resident | 178 × 28.5 | Meets 24-pixel minimum height |
| Header registration-mode switch | Official | 158.4 × 28.5 | Meets 24-pixel minimum height |
| Verification disclosure | Resident | 446 × 60.5 | Exceeds minimum |
| Barangay selector | Resident and official | 448 × 45 | Exceeds minimum |
| Primary/secondary residency selectors | Expanded verification | 388 × 35 each | Exceeds minimum |
| PhilSys, utility-bill, and secondary-ID upload labels | Expanded verification | 388 × 34 each | Visible wrapping labels measured; hidden file input boxes were not used as the target size |
| Resident data-privacy checkbox label | Resident | 448 × 39 | Exceeds minimum |
| Official affirmation checkbox label | Official | 448 × 39 | Exceeds minimum |
| Form submit button | Resident and official | 448 × 48 | Exceeds minimum |
| Footer registration-mode switch | Resident | 298 × 16 | 24-pixel circle clears nearest submit target by about 26 px |
| Footer registration-mode switch | Official | 311.2 × 16 | 24-pixel circle clears nearest submit target by about 26 px |
| “Log in here” link | Resident and official | 64.5 × 15 | 24-pixel circle clears nearest footer switch by about 17.5 px |
| “Apply for DILG review” link | Official | 126.6 × 15 | Closest case: circle clears barangay selector by about 3.5 px |

The two footer mode-switch buttons and short links are shorter than 24 CSS pixels, but the measured spacing did not show overlap with another target's bounds or another undersized target's spacing circle. The DILG link has the narrowest margin, so any future layout change near the barangay selector should preserve that clearance.

## 6. Accessibility Semantics Observed

- The header mode-switch buttons expose descriptive names: “Resident Registration, switch to official registration” and “Staff Registration, switch to resident registration.”
- The verification disclosure is a button with `aria-expanded`; Chrome exposed the expanded state as true when opened.
- Chrome exposed the barangay and residency controls as named comboboxes, and the PhilSys number and official passkey as named textboxes.
- The under-18 guardian control was exposed as a textbox named “GUARDIAN'S REGISTERED USERNAME *”; its DOM `required` state was true.
- The official passkey was exposed as a required textbox named “LGU ADMINISTRATIVE PASSKEY.”
- Resident privacy and official affirmation controls were exposed as named, unchecked checkboxes; their DOM `required` state was true.
- The upload control was exposed as a named button associated with its visible upload label. The measured target was the 388 × 34 CSS-pixel label, not the `sr-only` file input.

Relevant source: [Register.tsx](../../../../frontend/src/pages/auth/Register.tsx#L350), [ResidentVerificationUploads.tsx](../../../../frontend/src/components/auth/register/ResidentVerificationUploads.tsx#L42), [BarangaySelectField.tsx](../../../../frontend/src/components/auth/register/BarangaySelectField.tsx#L30), [FileUploadZone.tsx](../../../../frontend/src/components/ui/FileUploadZone.tsx#L21), and [AdminCredentialsSection.tsx](../../../../frontend/src/components/auth/register/AdminCredentialsSection.tsx#L18).

## 7. Screenshots

Screenshots were kept outside the repository and visually inspected. They are full-page captures at 2× device scale:

- `/tmp/m28-registration-resident-default-640-dsf2.png` — 1250 × 2298 pixels
- `/tmp/m28-registration-verification-expanded-640-dsf2.png` — 1250 × 3448 pixels
- `/tmp/m28-registration-combined-minor-expanded-640-dsf2.png` — 1250 × 3820 pixels
- `/tmp/m28-registration-official-registration-640-dsf2.png` — 1250 × 2016 pixels

## 8. Network and Runtime Checks

- Observed 41 browser requests; all used `GET` and returned HTTP 200, including the public barangay-directory reads.
- No non-GET requests or failed responses were observed.
- No browser console errors or uncaught exceptions were observed.
- The browser was restored to the resident default state after the synthetic guardian-state check; the date field was blank and no file inputs contained a selected file.

## 9. Findings and Suggestions

### Confirmed defects

None found in the audited viewport, conditional states, target bounds, or inspected accessibility names and states.

### Non-blocking suggestion

The footer registration-mode buttons and inline links have 15–16 CSS-pixel heights. Their measured spacing meets the 2.5.8 spacing exception in this layout, but increasing vertical padding to at least 24 CSS pixels could make these controls easier to activate. Preserve the current clearance around “Apply for DILG review” if nearby layout changes are made.

## 10. Limitations

- The 640 CSS-pixel viewport at 2× device scale is an emulation proxy; browser zoom UI and a physical device were not tested.
- Target measurements establish rendered geometry and spacing only. They do not establish motor usability or screen-reader behavior.
- Only the scoped registration page and states were inspected. This is not a complete WCAG conformance audit.
