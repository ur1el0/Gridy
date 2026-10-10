# Task Brief: Registration 200%-Equivalent Layout and Target-Size Audit

## 1. Metadata

- **Task ID:** `m28-registration-200-percent-target-size`
- **Task Type:** Read-only accessibility and responsive-layout audit
- **Target:** KapitBayan resident and official registration controls
- **Branch / Base:** `audit/registration-200-percent-target-size` / M27 checkpoint `b27f5e5`
- **Lead / Reviewer:** Codex, user-directed sole-agent mode

## 2. Objective and Scope

- **Goal:** Check the registration interface at a 640 CSS-pixel layout width, corresponding to 200% zoom from a 1280 CSS-pixel viewport, and inspect interactive target sizes and spacing.
- **States:** Resident default; expanded identity/residency verification; combined under-18 guardian plus expanded verification; official registration.
- **Non-goals:** Source/style/configuration changes, real personal data, file selection, account creation, API mutation, or production interaction.
- **Context:** M14 recorded 200% zoom and touch-target dimensions as unverified. M25/M27 audited 320 CSS-pixel reflow, but did not measure the 640-pixel 200%-equivalent layout or target geometry.

## 3. Current Behavior and Evidence

- Registration mode and conditional form content are implemented in `frontend/src/pages/auth/Register.tsx`.
- The header mode switch is in `frontend/src/components/auth/register/RegisterHeroBanner.tsx`.
- Proof upload labels wrap a visually hidden file input in `frontend/src/components/ui/FileUploadZone.tsx`.
- The official passkey and affirmation are in `frontend/src/components/auth/register/AdminCredentialsSection.tsx`.
- The previous M27 audit found no 320-pixel overflow; its report and limits are in `docs/ai-workflow/tasks/m27-registration-conditional-reflow-audit/AUDIT.md`.

## 4. Required Rules

- Follow `docs/ai-workflow/playbooks/AUDIT.md`; keep application source, configuration, and persistent data read-only.
- Use local Vite and an isolated local browser session only.
- Emulate a 640 CSS-pixel viewport with 2× device scale to approximate the layout and physical rendering of 200% browser zoom from 1280 CSS pixels. State that this is an emulation, not browser UI zoom.
- For size checks, measure the visible clickable label wrapping a visually hidden file input or checkbox, not only the hidden/native input's own box.
- Do not submit the form, enter personal values, select files, or initiate non-GET requests.
- Preserve unrelated untracked environment content.

## 5. Observable Acceptance Criteria

1. [x] At 640 CSS pixels, measure resident default, expanded verification, combined minor, and official states for document overflow and clipped/out-of-view content.
2. [x] Record visible target bounds for mode switches, disclosure, form submit, proof uploads, consent/affirmation labels, selects, and small links; assess the 24 CSS-pixel minimum or applicable spacing exception.
3. [x] Inspect temporary screenshots at 2× device scale for text wrapping, clipping, overlap, and visual hit-area affordances; keep screenshots outside the repository.
4. [x] Record relevant accessibility names, roles, required/expanded states, and measured target bounds.
5. [x] Confirm local browser/network health and verify no form submission, file selection, or non-GET request occurred.
6. [x] Save the audit report and ignored `STATUS.md`; make no application-source changes and checkpoint only M28 task documents.

## 6. Relevant Files

- `frontend/src/pages/auth/Register.tsx`
- `frontend/src/components/auth/register/RegisterHeroBanner.tsx`
- `frontend/src/components/auth/register/ResidentVerificationUploads.tsx`
- `frontend/src/components/auth/register/AdminCredentialsSection.tsx`
- `frontend/src/components/ui/FileUploadZone.tsx`
- `docs/ai-workflow/tasks/m14-accessibility-audit/AUDIT.md`
- `docs/ai-workflow/tasks/m27-registration-conditional-reflow-audit/AUDIT.md`

## 7. Risks and Limits

- Device-scale emulation tests layout and rendered hit-area geometry at a 2× scale, but it is not the browser's own zoom UI or a physical device.
- A source-level rectangle does not prove motor usability or assistive-technology behavior; distinguish measured geometry from user testing.
- Do not claim full WCAG conformance from this focused audit.
