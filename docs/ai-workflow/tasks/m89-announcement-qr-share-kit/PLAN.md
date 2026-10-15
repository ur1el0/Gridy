# Plan: M89 Cross-Channel Announcement QR Share Kit

## Milestone 1 — Record the revised scope
1. Keep work isolated on a branch based on current `origin/main`.
2. Record the accepted announcement share-kit scope, administrator-managed manual Facebook posting, and replacement of automated AC-18 publishing.
3. Record that M5's historical evaluation did not pass, while the QR share kit replaces M5 as the active emerging-technology deliverable.

## Milestone 2 — Add exact-link share materials
1. Add a stable announcement fragment to each public announcement card.
2. Scroll to the requested card after the tenant-scoped announcement list finishes loading; give a clear state if the target was removed or is unavailable.
3. Add an accessible share-kit dialog to the existing staff announcement share action.
4. Generate the QR code locally from the canonical announcement URL, and provide copy-link, copy-caption, and PNG-download actions.
5. Include a short Facebook/manual-distribution note that KapitBayan does not publish posts or control/monitor Facebook comments.

## Milestone 3 — Verify and review
1. Add focused tests for per-announcement deep links, target focus/missing targets, QR rendering, copy actions, and QR download.
2. Run the focused frontend tests, frontend lint, production build, and `git diff --check`.
3. Review the diff for tenant-safe URLs, no external QR request, no Meta credentials/API, no comment ingestion, and no change to the AI feature default.
4. Record actual check results in `STATUS.md`; do not run or claim the live M5 provider evaluation as part of this feature.

## Risks and controls
- **Wrong or stale QR target:** encode the exact public announcement fragment; show a missing-target notice when the announcement is absent.
- **External comment exposure:** administrators publish manually and must apply the Page's available comment controls. KapitBayan cannot prove or enforce the platform setting; if comments cannot be disabled, admins use another official channel. The original automated AC-18 feasibility gate is retired from active scope, not passed.
- **Untrusted QR service:** render the QR locally in the frontend, using only the canonical first-party URL as its content.
- **Evaluation overclaim:** preserve that M5 did not pass; do not equate an AI Studio smoke prompt or mocked tests with the 32-case blind evaluation. M5 is superseded by QR distribution in the revised scope.
