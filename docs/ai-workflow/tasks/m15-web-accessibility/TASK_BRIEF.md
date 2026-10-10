# Task Brief: Web Accessibility Controls and Dialogs

## 1. Metadata

- **Task ID:** `m15-web-accessibility`
- **Task type:** Accessibility remediation with regression tests
- **Branch:** `fix/web-accessibility-controls`
- **Owner:** Codex (user-directed sole-agent mode)

## 2. Goal and Non-Goals

Resolve the confirmed web registration barriers and modal-context defects from [M14](../m14-accessibility-audit/AUDIT.md): keyboard-operable, specifically named identity-proof uploads; associated residency-proof select labels; and accessible named dialogs with predictable keyboard focus for the audited queue-entry, document-review, and citizen document-request overlays.

Do not redesign layouts, change API behavior, alter role/tenant logic, add dependencies, change mobile code, broaden branding, or modify `.agents/`, `.codex/`, supplied logo assets, or unrelated task files.

## 3. Required Behavior

- Every file upload remains reachable by keyboard and has an accessible name that identifies the evidence being requested.
- Both residency-proof selects expose their visible labels programmatically.
- The three audited overlays expose a named modal dialog to assistive technology. Opening moves focus into the dialog; Tab and Shift+Tab remain inside; Escape closes; closing restores focus to the opening control when it still exists.
- Existing pointer behavior, submission callbacks, API requests, and visual layout remain intact.

## 4. Acceptance Criteria

1. [x] File input names identify PhilSys, utility bill, and optional secondary ID evidence; inputs are keyboard focusable with visible focus indication.
2. [x] Residency-proof selects have associated labels.
3. [x] `NewTicketModal`, `ReviewDocumentModal`, and `NewDocumentRequestModal` have accessible names and modal semantics.
4. [x] A shared, dependency-free focus utility handles initial focus, focus wrapping, Escape, and restoration; regression tests cover these behaviors.
5. [x] Frontend lint, targeted tests, full frontend tests, and production build pass; actual results are logged.
6. [x] Only scoped web accessibility source/tests and this task's documentation are committed; no push occurs.

## 5. Risks

- Focus restoration can fail if the triggering control unmounts; restore only when the original element remains connected.
- Multiple labels or duplicate IDs can produce confusing names; use stable unique IDs and verify with Testing Library queries.
- Tab trapping must handle zero or one focusable element and Shift+Tab at the first control.
