# Status — M47 Safe Schema Rollout Compatibility

## 1. Executive Summary

- **Task ID:** `m47-schema-rollout-compatibility`
- **State:** Implementation and local documentation checks complete; publication pending
- **Current milestone:** M1 — record schema rollout and verification contract
- **Branch:** `docs/m47-schema-rollout-compatibility`
- **Worktree:** `/tmp/gridy-m47-schema-rollout-compatibility`
- **Base:** M46 local checkpoint `0e990595cfc016bcd2828e94faae99f61f1c4c2b`, tree `1339cfbac4b449bd748ec1e02384106a35eb1a08`; equivalent remote tree on PR #177.
- **Implementer:** Codex (user-directed sole-agent mode)

## 2. Progress

| Milestone | State | Notes |
| --- | --- | --- |
| M1 — Record schema rollout and verification contract | Complete locally | ADR 014 and deployment guidance define staged schema evolution while preserving unverified release-specific gates. |

## 3. Baseline and Decisions

- M42 Phase 1 requires verification of serialized migration execution, failed-migration blocking, old/new schema compatibility, DNS-change reconnection, private-media authorization, and same-origin auth cookies.
- M43/M44 provide evidence for a one-shot migration gate and failure behavior. M43's subprocess test verifies settings do not resolve or set `hostaddr` for the PostgreSQL hostname; it does not simulate an active connection across DNS failover.
- Existing tests cover resident/private media authorization and refresh cookie `HttpOnly`, `SameSite=Strict`, and `/api/v1/auth/` path behavior.
- No active M43/M44 schema change is being deployed; there is no current old/new application compatibility rehearsal.
- M47 will define the future release contract and keep both release-specific old/new compatibility and actual database DNS failover as unverified gates.
- M42's subscription, named budget owner, data-location, legal/privacy, RPO/RTO, and business sign-off gates remain outside this task.
- Hindsight initiative capture was attempted but the local service refused connections at `127.0.0.1:9077`; no memory content informed this plan.

## 4. Files Changed or Created

- `architecture/decisions/014-safe-schema-rollout-compatibility.md` (new)
- `architecture/11-deployment-and-ci-cd.md`
- `docs/ai-workflow/tasks/m47-schema-rollout-compatibility/{TASK_BRIEF.md,PLAN.md,STATUS.md}`

## 5. Verification Log

| Check | Command | Result |
| --- | --- | --- |
| Branch creation | `git worktree add -b docs/m47-schema-rollout-compatibility /tmp/gridy-m47-schema-rollout-compatibility HEAD` from the M46 worktree | Created branch at local M46 checkpoint `0e990595cfc016bcd2828e94faae99f61f1c4c2b` (tree `1339cfbac4b449bd748ec1e02384106a35eb1a08`). |
| M42 release gate | Read M42 audit Phase 1 | Confirms old/new schema compatibility and DB DNS reconnect are explicit pre-pilot gates. |
| Existing release evidence | Read M43/M44 status and `backend/tests/test_deployment_runtime.py` | M43 checks no import-time DNS resolution/`hostaddr`; M44 checks serialized Compose migration success/failure. No live DNS failover or old/new app compatibility proof is claimed. |
| Existing auth evidence | `rg -n -i 'protected.*media|private.*media|media.*auth|SameSite|refresh_cookie|refresh_token.*cookie|cookie.*path' backend/gridy_auth/tests` | Existing private-media authorization, refresh-cookie path, HttpOnly, and SameSite assertions were found. |
| Hindsight | `hindsight_capture_initiative` | Unavailable: `ECONNREFUSED 127.0.0.1:9077`; no page content returned. |
| Consistency scan | `rg -n 'expand|backfill|contract|old/new|previous application|DNS|failover|reconnect|compatib|rollback|does not prove' architecture/decisions/014-safe-schema-rollout-compatibility.md architecture/11-deployment-and-ci-cd.md` | PASS: decision and deployment guide distinguish migration gating from compatibility, name DNS failover as unverified, and set rollout/rollback requirements. |
| Relative links | Python `Path.is_file()` check for ADR 013/014 links in deployment guide | PASS: both linked ADRs resolve. |
| Markdown whitespace | Python trailing-space/tab scan across the 2 changed docs and 3 task-packet Markdown files | PASS: no trailing whitespace in 5 Markdown files. |
| Diff hygiene and scope | `git diff --check`, `git diff --cached --check`, `git diff --name-only`, `git diff --cached --name-only`, `git status --short --branch` | PASS: clean; only the planned deployment guide is a tracked modification; new ADR 014 and ignored task packet are untracked before staging. |
| Application tests | Not run | Documentation-only scope; no application behavior changed. |

## 6. Remaining Work

- [x] Complete ADR and deployment-doc changes within the planned scope.
- [x] Run and record documentation and git hygiene checks.
- [ ] Commit and publish a stacked PR against M46 PR #177; do not merge or deploy.
