# Task Brief: M89 Cross-Channel Announcement QR Share Kit

## Metadata
- **Task ID:** `m89-announcement-qr-share-kit`
- **Task type:** Frontend feature and project-status documentation
- **Target:** Official announcement sharing and the public community bulletin
- **Branch:** `feat/announcement-qr-share-kit`
- **Base:** `origin/main` (`13ce01e067298d59c652ffc8b7791d8011b79406`)

## Goal
Help barangay administrators distribute official KapitBayan announcements through manual Facebook posting and other public channels using a stable link to the exact announcement, a locally generated QR image, and copyable post text. This QR share kit replaces the Gemini-based M5 evaluation as the active emerging-technology deliverable; retain the evaluation's failed/incomplete history without treating M5 as a current project gate.

## Scope and non-goals
- Add a staff share kit for an existing announcement with copyable canonical link and caption, a QR code generated in the browser, and a downloadable PNG.
- Make the public bulletin deep-link to the specific announcement and clearly handle a missing/removed target.
- Reuse the same QR/link for manual Facebook posts, printed notices, and other channels.
- Keep Facebook distribution administrator-managed and manual; do not add Meta API publishing, Page-token storage, comment reading, or automated retries. Admins apply the official Page's available comment controls before posting and use another official channel if comments cannot be disabled.
- Preserve the existing public announcement endpoint, tenant boundaries, and AI feature flag default (`PUBLIC_NAVIGATOR_ENABLED=False`).
- Record that the historical M5 evaluation did not pass, and that M5 is superseded by this QR share kit in the active project scope. Do not claim the 32-case blind evaluation passed.
- Record administrator-managed manual posting as the replacement for automated AC-18 publishing. The original programmatic Meta comment-control gate was not passed and is retired from active scope, not represented as technically satisfied.
- Do not add blockchain, external QR generation services, or new backend/AI infrastructure.

## Acceptance criteria
1. An authorized staff user can open the share kit for one announcement and see a URL that targets that exact announcement within the matching Barangay's public bulletin.
2. The browser generates a high-contrast QR code from that URL without sending the announcement URL to a QR vendor.
3. Staff can copy the canonical URL, copy Facebook-ready post text, and download the QR as a PNG.
4. The public bulletin scrolls to a valid announcement deep-link after its async load and reports when the requested announcement is unavailable.
5. Share-kit content directs administrators to post manually and apply the external Page's comment restrictions; no Facebook API calls or comment ingestion are introduced.
6. The QR code remains suitable for reuse in printed notices and other channels.
7. Documentation records M5 as superseded by the QR share kit and AC-18 automated publishing as replaced by administrator-managed manual posting. It preserves that neither the historical M5 evaluation nor the original Meta API feasibility gate passed.
8. Focused frontend tests, frontend lint/build, and `git diff --check` pass.

## Verification
- `npm --prefix frontend run test -- src/pages/services/Announcements.test.tsx src/pages/public/PublicAnnouncements.test.tsx`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`
- `git diff --check`
