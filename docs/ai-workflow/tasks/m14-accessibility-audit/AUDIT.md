# Web and Mobile Accessibility Baseline Audit

- **Date:** 2026-10-10
- **Branch:** `audit/frontend-accessibility`
- **Base:** M13 audit checkpoint `f7e162f`
- **Scope:** React and Flutter shared controls and representative registration, queue, and document workflows
- **Method:** Read-only source review, contrast calculations, existing lint/test baselines

## Summary

The source review found **4 confirmed accessibility findings**: 2 High and 2 Medium. The most direct barriers are inaccessible web proof-upload controls and mobile fields whose visible labels are not associated with the actual text field. Several custom web overlays also lack dialog semantics. Muted mobile text uses a color combination below WCAG AA contrast.

This is a baseline audit, not a compliance certification. The local Vite server started successfully, but the available Chrome DevTools bridge returned `Target closed`, so keyboard traversal, computed browser accessibility trees, zoom/reflow, and rendered contrast were not verified in a browser. No physical Android/iOS accessibility run was available.

## Findings

### [A11Y-01] Registration proof uploads are hidden from keyboard users and use a generic input name

- **Severity:** High
- **Confidence:** Confirmed by source
- **Category:** Web forms / keyboard access
- **WCAG:** 2.1.1 Keyboard; 1.3.1 Info and Relationships; 3.3.2 Labels or Instructions
- **Location:** `frontend/src/components/ui/FileUploadZone.tsx#L20-L38`; used three times by `frontend/src/components/auth/register/ResidentVerificationUploads.tsx#L85-L140`.
- **Current behavior:** The descriptive text is a standalone `<label>` without `htmlFor`. A second label wraps the file input, but that label only contains the generic filename/“Choose photo...” text. The input has `className="hidden"`, which Tailwind renders as `display: none`; it cannot receive keyboard focus. The component is used for PhilSys, utility-bill, and secondary-ID uploads in resident registration.
- **Impact:** Keyboard users cannot reach the file selector. Assistive technology does not receive the specific evidence type as the field name.
- **Recommended remediation:** Give each file input a stable ID, associate the descriptive label with it, keep the input visually hidden rather than `display:none`, and provide a visible focus indicator on the label/control when the input is focused.

### [A11Y-02] Mobile shared text fields do not associate their visible labels with the field

- **Severity:** High
- **Confidence:** Confirmed by source
- **Category:** Mobile forms / programmatic labels
- **WCAG:** 1.3.1 Info and Relationships; 3.3.2 Labels or Instructions; 4.1.2 Name, Role, Value
- **Location:** `mobile/lib/widgets/custom_text_field.dart#L38-L55` and `#L66-L87`; example use in `mobile/lib/widgets/resident_registration_details_section.dart#L64-L72`.
- **Current behavior:** `CustomTextField` renders the label as a separate `Text` sibling, then constructs `TextFormField` with an `InputDecoration` containing only `hintText`, icon, border, and padding. There is no `labelText`, explicit `Semantics` label, or other association between the visible field name and the editable field. This shared widget is used throughout registration and other mobile forms.
- **Impact:** Screen-reader users may hear only an example hint or an unlabeled field and cannot reliably distinguish required personal, address, or identity values.
- **Recommended remediation:** Provide the label through Flutter's field semantics (for example, an appropriately styled `InputDecoration.labelText`) while retaining the existing visual hierarchy; add semantics tests for representative fields.

### [A11Y-03] Several web modal overlays are not exposed as named dialogs

- **Severity:** Medium
- **Confidence:** Confirmed for missing dialog semantics; focus behavior needs browser verification
- **Category:** Web dialogs / assistive-technology context
- **WCAG:** 4.1.2 Name, Role, Value; follow the WAI-ARIA modal dialog pattern
- **Location:** `frontend/src/components/queue/NewTicketModal.tsx#L38-L58`; `frontend/src/components/documents/ReviewDocumentModal.tsx#L54-L79`; `frontend/src/components/citizen-documents/NewDocumentRequestModal.tsx#L24-L36`.
- **Current behavior:** These components render full-screen or drawer overlays, but their overlay content has no `role="dialog"`, `aria-modal="true"`, or `aria-labelledby`. Their visible headings are not connected to a dialog role. Other dialogs in the repository do add these attributes, so behavior is inconsistent.
- **Impact:** Screen readers are not told that a modal context has opened or which heading names it. The overlays also contain no source-level focus-management code; actual focus escape and return behavior remains unverified because browser inspection was unavailable.
- **Recommended remediation:** Give each modal an accessible dialog name and modal semantics, move focus into it on open, keep keyboard focus within it while open, support Escape where appropriate, and restore focus to the trigger on close. Verify with keyboard interaction and an accessibility-tree snapshot.

### [A11Y-04] Mobile hint and inactive navigation text are below normal-text contrast

- **Severity:** Medium
- **Confidence:** Confirmed from declared colors
- **Category:** Color contrast
- **WCAG:** 1.4.3 Contrast (Minimum)
- **Location:** `mobile/lib/core/theme/app_colors.dart#L12-L22`; `mobile/lib/widgets/custom_text_field.dart#L66-L72`; `mobile/lib/widgets/custom_bottom_nav.dart#L126-L149`.
- **Current behavior:** `AppColors.textHint` is `#94A3B8`; it is used for hint text on `inputBackground` `#E2E8F0`, giving a calculated contrast ratio of **2.08:1**. Inactive bottom-navigation labels also use `#94A3B8` on the white navigation surface, giving **2.56:1**. Normal-sized text requires at least 4.5:1.
- **Impact:** Placeholder guidance and inactive navigation labels are difficult to read for users with low vision.
- **Recommended remediation:** Choose text colors that meet 4.5:1 against each actual background, then verify the rendered combinations. Keep decorative icon contrast separate from text contrast checks.

## Suggestions and Unverified Risks

- `CustomBottomNav` uses `GestureDetector` and visually styles the selected item, but no explicit selected/current state is declared in `Semantics`. The gesture exposes a tap action; whether the platform announces selection correctly requires a device semantics-tree check. Add `selected` semantics and a widget-level semantics assertion if it is not announced.
- Some web queues update from polling. `PublicQueueDisplay` includes status/live-region semantics, while the staff `LiveQueue` and resident `CitizenQueue` do not declare an `aria-live` region for every changing ticket status. Confirm announcement needs during a browser screen-reader test before treating this as a defect; avoid repeatedly announcing the entire refreshed list.
- Visual checks for color combinations outside the exact mobile colors listed above, focus appearance, 200%/400% zoom, reflow, touch-target dimensions, and Android/iOS screen-reader behavior remain unverified.
- Positive patterns observed: `TextField` associates labels with inputs using `useId`; `AdminLayout` names its icon controls and exposes `aria-expanded`/`aria-controls`; `QueueHistoryModal` has a named dialog; `PublicQueueDisplay` uses status and live-region semantics.

## Finding Counts

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 2 |
| Medium | 2 |
| Low | 0 |
| **Total confirmed findings** | **4** |

## Verification

- `npm --prefix frontend run lint` — exit 0; no diagnostics.
- `npm --prefix frontend run test` — passed, 27 files and 73 tests.
- `/home/dokja/development/flutter/bin/dart analyze` (from `mobile/`) — `No issues found!`.
- `/home/dokja/development/flutter/bin/flutter test` (from `mobile/`) — `All tests passed!` (72 tests).
- Vite preview started at `http://127.0.0.1:5173/` and was stopped after inspection. Chrome DevTools `new_page` returned `Target closed`; no browser accessibility snapshot or Lighthouse report was available.
- `git diff --check` — clean. Tracked source diff and staged path list were empty before the audit-document checkpoint.
- No application, test, configuration, or dependency source changed. Existing untracked `.agents/`, `.codex/`, task/environment files, and supplied logo JPEGs were not edited or staged.
