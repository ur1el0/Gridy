# Task Brief: KapitBayan Product Rebrand

## 1. Metadata

- **Task ID:** `kapitbayan-rebrand`
- **Task type:** Product rebrand, asset integration, compatibility refactor, documentation
- **Target components:** Frontend, mobile, backend API metadata and demo presentation data, project documentation, CI labels
- **Lead / implementer / reviewer:** Codex (user-directed sole-agent mode)
- **Working branch sequence:** `feat/kapitbayan-rebrand` through `chore/kapitbayan-final-audit`, with review correction on `fix/kapitbayan-migration-and-brand-acceptance`
- **Push/deployment:** None authorized; local commits only

## 2. Objective and Scope

- **Goal:** Replace current user-facing Gridy branding with the exact product name **KapitBayan**, apply the supplied KapitBayan logo marks across web and mobile clients, and update current project-facing documentation while preserving persisted data and external service integrations.
- **Non-goals:** DNS/domain or email provisioning, Firebase project migration, production deploys, database schema/app-label/migration renames, external API route changes, native application ID changes, and edits to `.agents/` or `.codex/`.
- **Context:** The project has adopted the KapitBayan name and supplied two logo files. Existing pages, app metadata, code symbols, docs, seed copy, and mobile storage keys still contain the former brand. A broad text replacement could break persisted login state, database/migration history, service routing, or real support and cloud integrations.

## 3. Current Behavior and Evidence

- `frontend/src/assets/MainLogo.jpeg` is a 1024x1024 JPEG wordmark lockup; `MainLogo-2.jpeg` is a 1024x1024 symbol mark. Both have an opaque white canvas. The files are user-provided and must remain unchanged.
- `frontend/src/assets/MainLogo.svg` and `mobile/assets/images/MainLogo.svg` still contain the older shield / geometric G logo. Web layouts import the former; `mobile/lib/widgets/gridy_logo.dart` renders the latter.
- Product name text remains in web layout/auth/public screens, Flutter screens and support/privacy copy, Android app label, OpenAPI metadata, demo-seed presentation strings, and current documentation.
- CSS custom properties use a `--gridy-*` namespace. Flutter app/widget identifiers are `GridyApp` and `GridyLogo`.
- Mobile preferences and secure storage persist these keys: `gridy_access_token`, `gridy_refresh_cookie`, `gridy_cached_user`, `gridy_remember_me`, and `gridy_saved_username`. Renaming them without migration would sign out users or discard preferences.
- Current production identifiers include `gridy-backend.onrender.com`, `gridy.vercel.app`, Firebase project `gridy-66278`, and `support@gridy.gov.ph`. These are active integration/contact values, not confirmed rebrand replacements.
- Django package names/app labels (`gridy_auth`, `gridy_services`, `gridy_reports`, `gridy_communications`, `gridy_audit`), database/table/index identifiers, migration references, and database credentials are persisted system contracts.
- Existing release identity is `com.example.mobile`; changing it would change Android's install/update identity.

## 4. Required Rules and Brand Decisions

- Use exact display casing **KapitBayan**. User-facing product labels and document prose use this casing; the supplied wordmark remains the authoritative visual lockup.
- Preserve the current civic visual language and supplied navy/blue logo colors. This is a brand-asset and product-name update, not a layout redesign or a new palette proposal.
- Preserve the two JPEG source files and add transparent, production-ready derivatives. Remove only the exterior white canvas; preserve the white shapes inside the icon and the original wordmark, proportions, and colors.
- Preserve current auth, tenant, payment, audit, API, and navigation behavior. No role, permission, cookie, or endpoint changes are part of rebranding.
- Migrate mobile persisted values from old keys to new KapitBayan keys before deleting old copies. A failed destination write must never delete the only stored token or preference value.
- Do not invent or publish a new domain or support mailbox. Keep current production origins, Firebase project ID, and support email until provisioning and cutover are confirmed. Keep product-facing labels around those integrations branded KapitBayan where practical.
- Keep database and Django identifiers, mobile application ID, Compose database/container identifiers, repository URL/path, and compatibility aliases stable. Preserve old storage/env keys only where needed for an explicit forward-compatibility migration.
- Do not use a blind global replacement. Work from the source inventory, update assertions and fixtures intentionally, and produce a final remaining-reference classification.
- Do not modify `.agents/`, `.codex/`, or the supplied JPEG files. Their untracked/environment state has no reliable Git baseline.

## 5. Observable Acceptance Criteria

1. [x] Web and mobile app titles, visible navigation/auth/public labels, and logo alt text consistently use **KapitBayan**.
2. [x] Web and mobile clients use the supplied symbol at compact sizes and the supplied wordmark on light surfaces; transparent derivatives preserve the artwork. The symbol remains legible on light and navy surfaces. The supplied wordmark's dark lettering has insufficient contrast on navy, so it is not placed on navy.
3. [x] The old SVG logo is no longer imported or rendered after the new assets are integrated; the JPEG sources remain byte-for-byte unchanged.
4. [x] Mobile upgrade from all five legacy persisted keys preserves tokens, cached user, remember-me state, and saved username; subsequent writes use KapitBayan keys. Legacy values are removed only after successful migration.
5. [x] OpenAPI/API display metadata and current demo presentation strings identify KapitBayan; tests assert the new user-visible name.
6. [x] Current README, architecture, feature, setup, and operational documentation describe the product as KapitBayan without rewriting persisted Django identifiers or claiming a domain/Firebase/contact cutover.
7. [x] Safe internal branding tokens and labels are renamed, with explicit compatibility handling for existing test/storage configuration keys.
8. [x] No changes occur to database schema/history, app labels/table/index names, API paths, auth/RBAC, production origins, Firebase project ID, support mailbox, Compose DB identifiers, or Android application ID.
9. [x] All required frontend, backend, and mobile checks pass; no unintended `Gridy` product copy remains outside a documented compatibility/infrastructure/history allowlist.
10. [x] Changes are committed in focused local milestone checkpoints, with a new branch between milestones; no unrelated/untracked agent or environment files are staged, and nothing is pushed.

## 6. Relevant Areas

- Web branding: `frontend/index.html`, `frontend/src/assets/`, `frontend/src/components/layout/`, `frontend/src/pages/`, `frontend/src/index.css`, `frontend/tailwind.config.js`, related Vitest tests.
- Mobile branding and compatibility: `mobile/lib/main.dart`, `mobile/lib/widgets/`, `mobile/lib/screens/`, `mobile/lib/services/storage_service.dart`, `mobile/assets/images/`, `mobile/test/storage_service_test.dart`, `mobile/android/app/src/main/AndroidManifest.xml`.
- API/demo display data: `backend/config/settings.py`, `backend/schema.yml`, safe user-facing seed strings and relevant tests.
- Project copy/config labels: root README, current architecture/features/walkthrough docs, `.github/workflows/ci.yml`.
- Protected infrastructure/history: Django package/app identifiers and migrations, database settings, `frontend/vercel.json`, production host allowlists, Firebase project, support address, Compose database identity, repository path, and Android application ID.

## 7. Risks and Mitigations

- **Broken or distorted logo derivative:** Keep sources unchanged, inspect generated derivatives at native resolution, check alpha and artwork, and do not replace an existing asset until the result is validated.
- **Session loss during mobile key rename:** Migrate old secure/prefs values idempotently, preserve old values until new writes succeed, test each data class, and test clearing old and new keys.
- **Breaking persistent backend identity:** Exclude migrations, app labels, database names, service hosts, and current provider IDs from branding edits; final audit searches these separately.
- **False support/domain change:** Keep the current mailbox and hostnames until the replacement is provisioned. Report them as explicit remaining legacy identifiers.
- **Seed duplication or mutation:** Preserve fixture usernames, email identifiers, and deduplication markers unless a migration-safe, local-demo-only update is verified by tests. Never run seed commands against a production database.
- **Visual drift:** Retain existing layout and token values; update only logo/text identity and safe token names, then run the frontend checks and inspect rendered assets.
