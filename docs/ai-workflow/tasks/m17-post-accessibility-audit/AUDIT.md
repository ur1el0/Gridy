# Post-Remediation Accessibility Audit

- **Date:** 2026-10-10
- **Branch:** `audit/post-accessibility-remediation`
- **Base:** M16 mobile accessibility checkpoint `9a1b8a7`
- **Scope:** Recheck M14's web and mobile findings against M15/M16 source, tests, and local browser evidence.
- **Method:** Read-only source/test review, Flutter color calculations, local headless Chrome accessibility-tree and keyboard checks. No account creation, form submission, production access, or application edits.

## Executive Summary

The M15/M16 work addresses the four findings in the M14 baseline. The web registration upload labels, residency-proof labels, and keyboard reachability were also observed in a local Chrome run; modal names and focus behavior are covered by focused component/hook tests, but the authenticated modal flows were not manually opened in a browser. Mobile semantics and declared color combinations are verified by widget tests and Flutter checks; device screen-reader behavior remains unverified.

The local browser review found one additional confirmed form-label defect: the required **Local Barangay Jurisdiction** selector has no accessible name. Chrome's accessibility tree exposes it as an unnamed combobox, and the source renders a label without `htmlFor` beside a select without an `id`. This should be fixed in the next focused implementation milestone.

This report is limited to the M14 findings and the registration controls observed while verifying them. It is not a full WCAG conformance assessment.

## M14 Finding Follow-up

| Baseline finding | Status | Evidence |
|---|---|---|
| A11Y-01 — proof uploads are hidden from keyboard users and generically named | **Fixed; browser verified** | `FileUploadZone.tsx` associates the evidence label with a `useId()` input, keeps the input in `sr-only`, and styles the wrapping label on `:focus-within`. Chrome's AX tree showed evidence-specific names for all three upload controls. Actual Tab navigation reached the PhilSys file input; it had `tabIndex: 0` and `:focus-visible`, and a temporary screenshot showed a visible ring. The component test also verifies accessible label, focus, and file-change callback. |
| A11Y-02 — mobile shared text fields lack programmatic labels | **Fixed; source/test verified** | `CustomTextField` wraps `TextFormField` in `Semantics(label: label.toUpperCase())` at `mobile/lib/widgets/custom_text_field.dart#L53-L55`. `accessibility_widgets_test.dart#L11-L39` verifies the field name, text-field role, visible label, and editable controller behavior. |
| A11Y-03 — web overlays lack named dialog semantics and focus management | **Fixed; source/test verified, browser runtime partial** | The three audited overlays declare `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` in `NewTicketModal.tsx#L43-L49`, `ReviewDocumentModal.tsx#L63-L69`, and `NewDocumentRequestModal.tsx#L30-L36`. `AccessibleDialogs.test.tsx#L8-L69` verifies all three names. `useModalFocus.test.tsx#L22-L64` verifies initial focus, forward/reverse wrapping, Escape, and restoration. The local unauthenticated page did not expose these protected workflows, so those modal interactions were not repeated in browser. |
| A11Y-04 — mobile hints and inactive navigation text have low contrast | **Fixed; token/test verified** | `AppColors.textHint` is now `#475569`; inactive navigation uses `AppColors.textMuted` `#64748B`. The M16 widget test calculates each token combination and asserts at least 4.5:1. Exact calculated ratios are listed below. Device-rendered contrast remains unverified. |

## Confirmed Defect

### [A11Y-05] Required barangay selector has no accessible name

- **Severity:** High
- **Confidence:** Confirmed
- **Category:** Web forms / accessible names
- **WCAG:** 1.3.1 Info and Relationships; 3.3.2 Labels or Instructions; 4.1.2 Name, Role, Value
- **Location:** `frontend/src/components/auth/register/BarangaySelectField.tsx#L31-L41`, rendered from `frontend/src/pages/auth/Register.tsx#L372-L379`.
- **Current behavior:** The visible `LOCAL BARANGAY JURISDICTION` label has no `htmlFor`; the required `<select>` has no `id`, `aria-label`, or `aria-labelledby`.
- **Concrete evidence:** In the local resident-registration page, Chrome's accessibility tree returned a `combobox` with an empty accessible name, while the adjacent visible text was `LOCAL BARANGAY JURISDICTION`. The selector is required and offers the `Select your Barangay` placeholder.
- **Impact:** Screen-reader users cannot identify the required jurisdiction selector when navigating the registration form, which can prevent successful registration.
- **Recommended remediation:** Give the select a stable unique ID (for example, `useId()`), set the visible label's `htmlFor` to that ID, and add a component test using `getByLabelText('LOCAL BARANGAY JURISDICTION')`. Recheck its name in Chrome's accessibility tree.

## Contrast Evidence

Flutter's `Color.computeLuminance()` based test asserts the WCAG AA normal-text threshold for the actual shared hint token against the relevant declared surfaces and for inactive navigation text against white:

| Foreground | Background | Ratio | Result |
|---|---|---:|---|
| `#475569` (`textHint`) | `#E2E8F0` (`inputBackground`) | 6.15:1 | Pass |
| `#475569` (`textHint`) | `#EDF2F7` (`inputBackgroundFocused`) | 6.73:1 | Pass |
| `#475569` (`textHint`) | `#FFFFFF` (`surface`) | 7.58:1 | Pass |
| `#475569` (`textHint`) | `#F6F8FB` (`background`) | 7.12:1 | Pass |
| `#64748B` (`textMuted`) | `#FFFFFF` (`surface`) | 4.76:1 | Pass |

These values verify declared colors, not device rendering, opacity overlays, or every screen state.

## Browser Verification

- Vite served the local frontend on `http://127.0.0.1:5173`; the direct `/register` page loaded in isolated headless Chrome. The observed local page response and loaded app modules returned HTTP 200; no failed network requests or JavaScript exceptions were observed.
- After expanding **Identity & Residency Verification**, Chrome's accessibility tree exposed three named upload controls: `UPLOAD PHILSYS ID CARD PHOTO`, `UPLOAD RECENT UTILITY BILL (LAST 3 MONTHS)`, and `UPLOAD SECONDARY ID PHOTO` (with their visible `Choose photo...` text). It also exposed the two residency proof comboboxes under their visible names.
- Actual Tab key events moved from the verification section header through the PhilSys ID input to its file input. The file input was enabled, had `tabIndex: 0`, and matched `:focus-visible`. A temporary `/tmp` screenshot showed the visible focus indicator; no screenshot was added to the repository.
- The same accessibility tree revealed A11Y-05: an unnamed combobox for the barangay selector.
- The Chrome DevTools MCP bridge itself returned `Target closed`; local browser evidence was gathered with an isolated headless Chrome and Chrome DevTools Protocol. The `axe-core` package is not installed, so no axe scan was run. No screenshot baseline exists for visual-diff testing.
- The local registration route does not expose the role-protected queue/document dialogs without authentication. No credentials or data were created or used; dialog verification is based on source and passing tests.

## Suggestions & Unverified Risks

- Add the A11Y-05 label fix and regression test as a separate, focused milestone.
- Verify the dialogs with keyboard and a screen reader in an authenticated non-production environment when a test account/browser setup is available.
- Test Flutter semantics and contrast on Android TalkBack and iOS VoiceOver devices before claiming platform-level accessibility coverage.
- Consider a configured axe or Lighthouse accessibility scan for broader page coverage. A clean automated scan would still not replace keyboard and screen-reader checks.

## Finding Counts

| Severity | Confirmed in this audit |
|---|---:|
| Critical | 0 |
| High | 1 |
| Medium | 0 |
| Low | 0 |
| **Total new confirmed defects** | **1** |

The four M14 findings are classified as fixed at the source/test level, with the browser and device limitations stated above.

## Verification Results

| Check | Command / Method | Result |
|---|---|---|
| Frontend lint | `npm --prefix frontend run lint` | Exit 0 |
| Focused web tests | `npm --prefix frontend run test -- src/components/ui/FileUploadZone.test.tsx src/components/auth/register/ResidentVerificationUploads.test.tsx src/hooks/useModalFocus.test.tsx src/components/accessibility/AccessibleDialogs.test.tsx` | 4 files, 6 tests passed |
| Full frontend suite | `npm --prefix frontend run test` | 31 files, 79 tests passed |
| Frontend production build | `npm --prefix frontend run build` | TypeScript/Vite passed; 2,509 modules transformed, build completed in 1.04s |
| Flutter analysis | From `mobile/`: `/home/dokja/development/flutter/bin/dart analyze` | `No issues found!` |
| Full Flutter suite | From `mobile/`: `/home/dokja/development/flutter/bin/flutter test` | `All tests passed!` (75 tests) |
| Local browser checks | Isolated headless Chrome via CDP on local Vite | Page/AX tree/keyboard checks above passed; found A11Y-05 |
| Axe scan | `axe-core` availability check | Not run; package not installed |
| `git diff --check` | `git diff --check` | Clean (exit 0) |
