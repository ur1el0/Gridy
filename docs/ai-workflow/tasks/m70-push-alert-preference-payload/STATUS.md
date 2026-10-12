# Status: M70 Push Alert Preference Payload

## Summary
- **Task ID:** `m70-push-alert-preference-payload`
- **State:** In Progress
- **Current milestone:** M1 — reproduce, fix, and verify payload defect
- **Branch:** `fix/m70-push-alert-preference-payload`
- **Base:** M69 PR head `c1745472cbdaae788f546600c7645beec0d19297`
- **Worktree:** `/tmp/gridy-m70-push-preference-payload`
- **Primary checkout:** Untouched

## Evidence and scope
- `frontend/src/pages/admin/Settings.tsx::handleTogglePush` computes `newValue = !pushAlerts` but currently sends `{ push_alerts: pushAlerts }` to `PATCH /auth/me/`.
- M69's Settings page and PR remain unchanged. This is the explicitly deferred, independent payload correction.
- No backend/API contract, schema, dependency, infrastructure, or Azure pilot changes are planned.

## Verification log
### Regression reproduction (before fix)
- **Command:** `npm --prefix frontend run test -- src/pages/admin/Settings.test.tsx`
- **Result:** Expected red — 1 test file, 2 failed and 6 passed. The enabling test observed `{ push_alerts: false }` instead of `true`; the disabling test observed `{ push_alerts: true }` instead of `false`.

### Fix and verification
- The handler now sends its computed `newValue`; local state still changes only after the PATCH resolves successfully.
- **Focused:** `npm --prefix frontend run test -- src/pages/admin/Settings.test.tsx` — PASS, 1 file and 9 tests.
- **Full frontend tests:** `npm --prefix frontend run test` — PASS, 40 files and 144 tests.
- **Lint:** `npm --prefix frontend run lint` — PASS, exit code 0 with no diagnostics.
- **Build:** `npm --prefix frontend run build` — PASS, TypeScript and Vite production build; 2,514 modules transformed.
- **Diff hygiene:** `git diff --check` — PASS; task packet whitespace scan — no trailing whitespace found.
- **Scope:** Only `Settings.tsx`, `Settings.test.tsx`, and the M70 task packet changed. No backend/API, schema, dependency, infrastructure, or Azure pilot files changed.

## Delivery
Local implementation and verification are complete. Code commit, push, PR, and hosted checks are pending. M69 PR #200 is open and unmerged. Azure pilot remains NO-GO.
