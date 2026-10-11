# Plan: Web Accessibility Controls and Dialogs

> **Work contract:** Fix only M14's confirmed web findings. Preserve current product behavior and layout. Add regression tests before checkpointing this milestone.

## Milestone 1: Registration Input Semantics

1. Refactor `FileUploadZone` markup so the descriptive label names the native file input, the input is visually hidden but remains focusable, and the control shows focus visibly.
2. Associate both residency-proof `<select>` elements in `ResidentVerificationUploads` with their labels.
3. Add component tests asserting accessible names and keyboard focusability.

## Milestone 2: Named Dialogs and Focus Management

1. Add a small shared React hook for modal focus: focus into the dialog on mount, wrap Tab/Shift+Tab, close on Escape, and restore focus on unmount if the trigger remains connected.
2. Apply `role="dialog"`, `aria-modal="true"`, and a labelled-by heading to the audited queue-entry, document-review, and new-document-request overlays.
3. Add focused tests for the shared hook and dialog names. Keep existing component callbacks and dismissal behavior.

## Validation

```bash
npm --prefix frontend run lint
npm --prefix frontend run test -- src/components/ui/FileUploadZone.test.tsx src/hooks/useModalFocus.test.tsx
npm --prefix frontend run test
npm --prefix frontend run build
git diff --check
```

Record actual command results and any limitations in local ignored `STATUS.md`. Do not add packages or modify unrelated modules.

## Completion Gate

- All acceptance criteria in `TASK_BRIEF.md` are met.
- Focus logic and semantic names have regression tests.
- Diff inspection confirms only the scoped web controls/dialogs/tests and M15 documents are included.
- Commit the scoped local checkpoint, then open the separate mobile accessibility milestone branch.
