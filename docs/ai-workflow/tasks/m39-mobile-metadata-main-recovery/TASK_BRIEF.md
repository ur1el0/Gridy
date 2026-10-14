# Task Brief: Recover M39 Mobile Profile Metadata Fix on Mainline

## Metadata

- **Task ID:** `m39-mobile-metadata-main-recovery`
- **Type:** Mobile profile payload bug fix
- **Branch:** `fix/m39-mobile-metadata-main-recovery`
- **Base:** `d09a26342c2f47b7ca6c7d9bb9a45e4427366d7f` (`origin/main`)
- **Worktree:** `/tmp/kapitbayan-m39-mobile-metadata-main-recovery`

## Goal

Preserve resident evidence metadata during ordinary profile edits. The profile screen currently initializes dropdowns to UI fallback values and sends both values on every save. A resident with legacy or unrecognized metadata can therefore have that metadata overwritten without changing the dropdown.

## Scope

- Track whether the secondary ID type or utility billing type dropdown changed in the current edit session.
- Send each type only after an explicit selection.
- Clear tracking when profile state is reset after cancel or a successful save.
- Add regression tests for ordinary legacy profile edits, explicit selections, and reset behavior.

## Non-goals

- No backend, schema, API contract, dependency, payment, or production deployment changes.
- No unrelated dialog, registration, or evidence-retention changes.
- Preserve the existing rule that at least one proof must remain on file.

## Acceptance Criteria

1. Ordinary profile edits omit `secondary_id_type` and `utility_billing_type` from the update payload.
2. Explicitly changing either dropdown includes that field in the update payload.
3. Cancelling an edit or successfully saving clears the explicit-change flags; a later ordinary edit omits both type fields.
4. Legacy/unrecognized server metadata remains unchanged when a resident saves ordinary profile fields.
5. Targeted and full mobile verification results are recorded accurately in `STATUS.md`.
6. No migrations or dependency changes are introduced; `git diff --check` is clean.
