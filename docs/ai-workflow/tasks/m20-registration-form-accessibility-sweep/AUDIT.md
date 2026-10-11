# Audit: Registration Form Accessibility Sweep

- **Date:** 2026-10-10
- **Branch:** `audit/registration-form-accessibility-sweep`
- **Base:** M19 browser recheck checkpoint `cb4de51`
- **Scope:** Resident and official registration form control names, conditional disclosure controls, required/disabled state, and keyboard focus.
- **Method:** Read-only source inspection plus local Vite and isolated HeadlessChrome 155 through Chrome DevTools Protocol. No credentials, field values, file choices, registration requests, or production access.

## Executive Summary

Chrome's accessibility tree exposed meaningful names for the controls inspected in both registration modes, including the previously fixed jurisdiction selector and the verification upload controls. Resident Tab navigation reached the form fields and upload controls with visible focus. The optional secondary-ID upload was disabled until a secondary ID type is selected, matching the UI state.

One confirmed defect remains in official registration: the affirmation checkbox is required by the application logic and disables account creation until checked, but the checkbox is not marked `required` in the DOM. In the browser accessibility tree it was announced as unchecked without a required/invalid state. The resident privacy checkbox, which is marked `required`, was exposed as invalid while unchecked. This can leave assistive-technology users without a programmatic explanation for why the official registration action is unavailable.

This is a focused registration-form audit, not a full WCAG conformance assessment.

## Findings

### [A11Y-06] Official registration affirmation is mandatory but not exposed as required

- **Severity:** Medium
- **Confidence:** Confirmed
- **Category:** Web forms / required-state semantics
- **WCAG:** 3.3.2 Labels or Instructions; 4.1.2 Name, Role, Value
- **Location:** `frontend/src/components/auth/register/AdminCredentialsSection.tsx#L33-L42`; enforcement in `frontend/src/pages/auth/Register.tsx#L94-L97` and `#L438-L442`.
- **Current behavior:** The checkbox label clearly states the affirmation, but the checkbox has no `required` attribute. The registration handler rejects an unaffirmed official registration, and the submit button is disabled while `affirmation` is false.
- **Concrete evidence:** The rendered official-mode checkbox had `required=false`, `checked=false`, and an accessible name. Chrome AX reported role `checkbox`, name `I affirm that I am an authorized barangay official or personnel and agree to official LGU protocols.`, `checked=false`, and `invalid=false`; no required state was exposed. By comparison, the resident privacy checkbox is rendered with `required` and Chrome exposed it as invalid while unchecked.
- **Impact:** A screen-reader user hears the checkbox name and checked state but is not told that checking it is mandatory. The submit button is disabled until it is checked, which can make the reason for the unavailable action unclear.
- **Recommended remediation:** Mark the checkbox `required` and add a regression test that queries it by its visible label and asserts the required state. Preserve the existing button gating and registration validation.

## Verified Controls

### Resident mode

- Accessible names appeared for full name, username, email, contact number, date of birth, jurisdiction, password, confirmation password, privacy consent, verification disclosure, mode switch, account creation button, and login link.
- The privacy checkbox was required; the account creation button was disabled before consent and barangay setup conditions were met.
- After opening the verification disclosure, the PhilSys ID input and both residency selectors had descriptive names. The three uploads appeared as buttons with evidence-specific names: `UPLOAD PHILSYS ID CARD PHOTO Choose photo...`, `UPLOAD RECENT UTILITY BILL (LAST 3 MONTHS) Choose photo...`, and `UPLOAD SECONDARY ID PHOTO Choose photo...`.
- File inputs had `tabIndex=0`; PhilSys and utility upload inputs were enabled. The secondary upload was disabled because the optional secondary ID type was empty.
- A real Tab-key sequence reached the evidence upload controls. When a file input received keyboard focus, its wrapping label had a non-empty computed focus-within ring. No file was chosen.

### Official mode

- All visible controls had names in the AX tree: shared identity and password fields, jurisdiction, administrative passkey, affirmation checkbox, account creation button, registration-mode switch, DILG application link, and login link.
- The affirmation checkbox defect above is the only confirmed finding from the inspected control names/state.

## Browser and Verification Evidence

| Check | Method | Result |
|---|---|---|
| Local registration document | `http://127.0.0.1:5173/register` via Vite | HTTP 200; title `KapitBayan` |
| Resident control names | `Accessibility.getFullAXTree` and DOM labels | All inspected controls had understandable names |
| Verification disclosure and uploads | Local UI disclosure click; AX/DOM inspection | Three upload controls rendered with specific names; two enabled, optional third disabled |
| Keyboard traversal | CDP Tab key events from page start | Reached resident controls and both enabled file inputs; computed focus-within ring applied to the upload label |
| Official mode | Local mode-toggle click; AX/DOM inspection | Official controls named; affirmation required-state defect confirmed |
| Browser health | CDP network/runtime/console events after reload | 0 console warnings/errors, 0 uncaught exceptions, 0 failed requests; local app and public directory responses were HTTP 200 |
| Form mutation | DOM/network inspection | No fields filled, files selected, or form submitted |
| Automated accessibility scan | Not run | No axe scan performed |
| Keyboard activation of UI toggles | CDP-generated Enter events | Not confirmed; the toggles were opened using local DOM `.click()` while keyboard Tab reachability was checked separately |

## Limitations and Next Step

- Screen-reader speech and physical-device behavior were not tested.
- Resident minor-only guardian controls were not runtime-rendered because no birth date was entered; source shows the guardian input uses the shared labeled `TextField` component.
- The browser inspected local desktop rendering only. No 200%/400% zoom, mobile viewport, full-page axe scan, or complete WCAG certification was performed.
- Create a separate focused implementation milestone for A11Y-06, then verify the required state with a component regression test and recheck the official-mode AX tree.

## Finding Counts

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 0 |
| **Total confirmed defects** | **1** |

## Suggestions and Non-blockers

- The verification disclosure updates its visible instruction between “Tap to expand” and “Tap to collapse,” so its state is reflected in the accessible name. It does not expose `aria-expanded`/`aria-controls`; adding the standard disclosure state would make the state available as a dedicated AX property. This was not classified as a confirmed defect in this focused sweep.
- Synthetic CDP Enter did not activate the disclosure or mode buttons. The audit confirms keyboard focus traversal, while the two local state transitions were inspected with DOM-only clicks; keyboard activation remains unverified.
