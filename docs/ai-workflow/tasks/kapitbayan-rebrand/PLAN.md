# Implementation Plan: KapitBayan Product Rebrand

> **Work contract:** The user has directed Codex to plan, implement, verify, and self-review all milestones without handing implementation to Antigravity or pausing for user questions. Complete one milestone at a time, make a local scoped checkpoint, then create the next branch. Do not push, deploy, provision external services, or edit production data.

## 1. Plan Overview

- **Associated brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Target branch:** `feat/kapitbayan-rebrand`
- **Complexity:** High
- **Schema expectation:** No migrations and no changes to persisted Django identifiers.
- **Brand direction:** Civic, calm, and legible. Use the supplied navy/blue logo, preserve existing layout and palette, and use the exact `KapitBayan` spelling.
- **Milestone boundaries:** M1 Web brand and assets (`feat/kapitbayan-rebrand`); M2 Mobile and preference continuity (`feat/kapitbayan-mobile-branding`); M3 API/demo content and documentation (`docs/kapitbayan-product-copy`); M4 safe identifier cleanup and cross-platform regression (`chore/kapitbayan-final-audit`); M5 review correction (`fix/kapitbayan-migration-and-brand-acceptance`). Names may be adjusted only if Git or repository evidence requires it; record any adjustment here.
- **Checkpoint policy:** After each milestone, review its explicit diff, run the listed checks, update `STATUS.md`, commit only scoped tracked files, and create the next branch. Keep `.agents/`, `.codex/`, source JPEGs, and unrelated untracked files out of staging. Local commits only.

## 2. Milestones

### Milestone 1: Web Brand and Logo Assets

- **Objective:** Replace old web identity with the supplied KapitBayan marks and accessible product name without changing page behavior or layout.
- **Files to inspect/modify:** `frontend/src/assets/`, `frontend/index.html`, `frontend/src/components/layout/Sidebar.tsx`, `CitizenLayout.tsx`, auth/public pages and tests, `frontend/src/index.css`, `frontend/tailwind.config.js`, chart styles that reference the tokens.
- **Actions:**
  1. Produce transparent PNG derivatives for the supplied wordmark and symbol. Preserve source JPEGs; remove only exterior white and visually inspect letterforms, edges, colors, and transparency.
  2. Use the symbol in compact headers, retain the wordmark for an appropriate lockup/document use, and update favicon plus meaningful/decorative alt behavior.
  3. Replace visible `Gridy` labels and title metadata in web pages with `KapitBayan`; update affected tests.
  4. Rename internal `--gridy-*` CSS variables to `--kapitbayan-*` consistently in CSS, Tailwind config, and direct chart references while keeping all existing token values.
  5. Remove the old web SVG only after repository search confirms no remaining imports.
- **Validation:**
  ```bash
  npm --prefix frontend run test
  npm --prefix frontend run lint
  npm --prefix frontend run build
  git diff --check
  ```
- **Expected outcome:** The web app and browser metadata show KapitBayan with the new mark; UI tests pass and no `--gridy-*` references remain in live frontend styles.

### Milestone 2: Mobile Brand and Safe Preference Migration

- **Objective:** Apply KapitBayan name/assets to the Flutter and Android UI while preserving existing installed-user sessions and preferences.
- **Files to inspect/modify:** `mobile/lib/main.dart`, `mobile/lib/widgets/gridy_logo.dart` and its callers, affected screen labels, `mobile/lib/services/storage_service.dart`, storage tests, mobile assets, Android manifest and launcher resources.
- **Actions:**
  1. Add the validated transparent symbol asset to Flutter and replace the old SVG display. Keep the larger square wordmark out of the mobile bundle unless a screen has a visually appropriate large lockup.
  2. Rename `GridyApp`/`GridyLogo` and the mobile logo file to KapitBayan names; update imports and test references.
  3. Update visible product labels, application title, Android launcher label and icon, and generated PDF filenames. Keep Android `applicationId` unchanged.
  4. Rename persisted mobile keys to `kapitbayan_*`. During initialization, read the new key first; if absent, migrate the old secure-storage or SharedPreferences value to the new location. Only delete the old value after a successful write. Migrate cached-user and login preferences without losing them. Clear both namespaces on logout/reset.
  5. Add tests for old secure token keys, old preference copies, new-key precedence, idempotent migration, and cleanup behavior.
  6. Delete the old mobile SVG after proving no remaining app references; preserve the supplied source JPEGs.
- **Validation:**
  ```bash
  cd mobile
  /home/dokja/development/flutter/bin/dart analyze
  /home/dokja/development/flutter/bin/flutter test
  /home/dokja/development/flutter/bin/flutter build apk --debug
  ```
  Also run `git diff --check` from the repository root.
- **Expected outcome:** Current and upgraded installations retain session/profile/login state; new installations use KapitBayan assets and names.

### Milestone 3: API Display Data and Current Documentation

- **Objective:** Rebrand API display metadata, generated demo presentation copy, and maintained product documentation while keeping integrations and stored identifiers stable.
- **Files to inspect/modify:** `backend/config/settings.py`, `backend/schema.yml`, public/demo seed copy and relevant tests; root `README.md`; current `architecture/`, `docs/features/`, and `docs/walkthrough/` content; product copy in frontend/mobile.
- **Actions:**
  1. Change OpenAPI title and product-description strings to KapitBayan; leave URL paths, permission classes, and Django app paths unchanged.
  2. Update user-visible FAQ/demo narratives and generated display names where it is idempotent. Preserve demo usernames, email identifiers, and deduplication markers unless an explicitly tested local-demo-only rename can safely update existing synthetic rows in place.
  3. Update maintained README, architecture, feature, and walkthrough prose to KapitBayan. Preserve repository clone URLs/path instructions and all technical Django package/migration identifiers.
  4. Update tests that assert user-facing brand text. Keep production API host assertions unchanged.
  5. Do not edit `.agents/`, `.codex/`, historical task artifacts, or binary user assets.
- **Validation:**
  ```bash
  venv/bin/pytest backend
  DEBUG=True venv/bin/python backend/manage.py test gridy_auth gridy_services gridy_communications gridy_reports --verbosity 1
  DEBUG=True venv/bin/python backend/manage.py check
  DEBUG=True venv/bin/python backend/manage.py spectacular --file /tmp/kapitbayan-schema.yml --validate
  git diff --check
  ```
- **Expected outcome:** API display metadata and current product prose identify KapitBayan; backend schema, behavior, and seed idempotency remain intact.

### Milestone 4: Safe Internal Labels, Allowlist Audit, and Full Regression

- **Objective:** Rename safe internal brand labels, preserve compatibility where old identifiers are persisted externally, and finish a complete cross-platform legacy-reference review.
- **Files to inspect/modify:** `backend/config/settings.py`, backend app config class names, `.github/workflows/ci.yml`, current tests, and remaining tracked project prose/configuration discovered by the final inventory.
- **Actions:**
  1. Rename safe class/workflow/image labels that do not define persistent database, package, repository, deployment, or user-storage identity.
  2. Introduce `KAPITBAYAN_TEST_USE_SQLITE` as the preferred test toggle while continuing to read `GRIDY_TEST_USE_SQLITE` as a compatibility fallback; update CI and examples to the new setting.
  3. Search tracked application/docs/config paths for case-insensitive `Gridy` occurrences. Classify every remaining match; update only current product copy and safe internal labels.
  4. Confirm approved residuals are limited to compatibility and operational identifiers: Django package/app/table/index/migration history, database/Compose identities, Git repository URL/path, active Render/Vercel domains, Firebase project, support mailbox until provisioned, Android application ID, legacy mobile-key/env migration literals, and immutable/untracked agent history.
  5. Run full backend, frontend, and Flutter suites plus config/schema/migration and diff checks; record actual results and warning conditions.
  6. Commit a focused final checkpoint and create no deployment or external provider changes.
- **Validation:**
  ```bash
  venv/bin/pytest backend --collect-only -q
  venv/bin/pytest backend
  DEBUG=True venv/bin/python backend/manage.py test gridy_auth gridy_services gridy_communications gridy_reports --verbosity 1
  DEBUG=True venv/bin/python backend/manage.py check
  DEBUG=True venv/bin/python backend/manage.py makemigrations --check --dry-run
  npm --prefix frontend run lint
  npm --prefix frontend run test
  npm --prefix frontend run build
  cd mobile && /home/dokja/development/flutter/bin/dart analyze
  cd mobile && /home/dokja/development/flutter/bin/flutter test
  git diff --check
  git diff --cached --name-only
  ```
- **Expected outcome:** No unapproved legacy product copy remains, old persisted sessions continue to work, all suite counts are recorded, and infra/history references remain explicitly classified.

### Milestone 5: Review Correction — Preserve Failed Preference Migrations

- **Objective:** Honor the existing migration safety acceptance criterion when a SharedPreferences destination write returns `false`, and document the logo contrast limit established by visual inspection.
- **Files:** `mobile/lib/services/storage_service.dart`, `mobile/test/storage_service_test.dart`, and the rebrand task brief, plan, and local status record.
- **Actions:**
  1. Check the boolean results from cached-user, remember-me, and saved-username destination writes; keep the legacy source value when any write fails.
  2. Add a narrow dependency injection point and regression test with a preferences fake that rejects writes; preserve the existing successful migration coverage.
  3. Inspect the transparent symbol and wordmark over light and navy surfaces. Keep the symbol for dark/compact headers and the wordmark on light surfaces; do not recolor supplied artwork.
  4. Record the minimal acceptance-criteria clarification and actual verification in `STATUS.md`.
- **Validation:**
  ```bash
  cd mobile && /home/dokja/development/flutter/bin/dart format lib/services/storage_service.dart test/storage_service_test.dart
  cd mobile && /home/dokja/development/flutter/bin/dart analyze
  cd mobile && /home/dokja/development/flutter/bin/flutter test test/storage_service_test.dart
  cd mobile && /home/dokja/development/flutter/bin/flutter test
  git diff --check
  ```
- **Expected outcome:** No legacy preference source is deleted after a reported destination-write failure; all mobile tests and analysis pass; asset usage documentation matches observed contrast.

## 3. Shared Acceptance Checks

- [x] No auth/tenant/payment behavior, endpoint paths, migrations, or production integration values change.
- [x] Both supplied JPEG files remain unchanged; derived image assets have an alpha channel and are inspected on light and navy surfaces. Use the supplied wordmark only on light surfaces and the symbol on light or navy surfaces because the wordmark's dark lettering does not contrast adequately on navy.
- [x] Existing mobile state migrates without loss, and legacy keys are deleted only after successful migration.
- [x] Tests exercise updated product labels and migration compatibility.
- [x] Worktree diffs and each milestone commit contain no `.agents/`, `.codex/`, unrelated environment files, or untracked user assets.
- [x] No changes are pushed or deployed.

## 4. Risks and Rollback

- Keep each milestone's commit isolated; revert only that milestone if checks fail.
- The full rebrand is not a DNS, Firebase, database, or email cutover. These remain follow-up operational work after owners provision replacements.
- If image editing fails to preserve exact logo content, do not substitute a generated redesign; retain sources and use an exact vector/alpha derivative with documented review.
- Mobile key migration must be idempotent and preserve source values if secure storage writes fail.
- The project task docs may be ignored/untracked locally; keep `STATUS.md` in the workspace and never force-add agent/environment directories.
