# Plan: M70 Push Alert Preference Payload

## Milestone 1 — Reproduce and fix the payload defect
1. Add focused tests for toggling push alerts on and off. Assert the PATCH payload and deferred state update behavior.
2. Run the focused test before the fix and record the expected failure.
3. Change the handler to send the computed next value while retaining its existing success-only state update and error toast.
4. Rerun focused tests, then full frontend tests, lint, production build, and `git diff --check`.
5. Record actual outputs and delivery details in `STATUS.md`.

## Boundaries and risk controls
- Work only in `/tmp/gridy-m70-push-preference-payload` on `fix/m70-push-alert-preference-payload`.
- Keep M69 untouched; this branch is based on M69's pushed PR head.
- No API/schema/dependency/infrastructure change is expected. If verification shows otherwise, stop and document the discrepancy before expanding scope.
- Keep the Azure pilot at NO-GO. Do not merge or deploy.
