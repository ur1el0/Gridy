# Task Brief: Remaining Source Modularity Audit

## 1. Metadata

- **Task ID:** `m6-remaining-source-modularity-audit`
- **Task Type:** Architecture / maintainability audit
- **Target Components:** Backend, frontend web, Flutter mobile
- **Lead / auditor:** Codex (temporary sole-agent mode)
- **Branch:** `audit/remaining-source-modularity`

## 2. Objective & Scope

- **Goal:** Review remaining large application source and domain test modules against `.agents/AGENTS.md` and identify only concrete, cohesive module boundaries that would improve maintainability.
- **Non-goals:** Do not modify source or test code, move files, alter APIs or schemas, change behavior, stage or commit unrelated files, or edit `.agents/`, `.codex/`, supplied logo JPEGs, or generated assets.
- **Context:** M4 completed its planned backend test/view, React page, and Flutter widget decomposition. Its baseline inventory still showed several files above roughly 300 lines, and its plan deferred `backend/config/settings.py`, `frontend/src/pages/citizen/CitizenDocuments.tsx`, and `frontend/src/pages/admin/Dashboard.tsx` unless clear boundaries were found.

## 3. Current Behavior & Evidence

- The shared architecture rule calls for Django view/model modules above roughly 300 lines to be split by domain, and React/Flutter parent pages to focus on orchestration while complex subtrees live in components/widgets.
- Initial tracked-source candidates include `backend/config/settings.py`, `backend/gridy_services/views/documents.py`, `backend/gridy_services/views/queue.py`, `frontend/src/pages/citizen/CitizenDocuments.tsx`, `frontend/src/pages/auth/Register.tsx`, `frontend/src/pages/services/LiveQueue.tsx`, `frontend/src/pages/admin/Dashboard.tsx`, and large Flutter screens. M4's domain test packages also contain files above 300 lines; assess whether each remains cohesive within its test domain.
- M4 intentionally retained some files after responsibility review; line count alone is not evidence to split.

## 4. Required Rules

- Follow the read-only requirements in `docs/ai-workflow/playbooks/AUDIT.md`.
- Inspect actual responsibilities, dependencies, state ownership, import boundaries, and existing tests before recommending extraction.
- Keep Django tenant isolation, RBAC, API contracts, and ADR-defined behavior in view.
- Recommend no more than one highest-priority implementation target for the next code milestone. If no file has a clean seam, record that finding and recommend a different local priority.

## 5. Observable Acceptance Criteria

1. [ ] Produce reproducible inventories of tracked, application-owned Python, TSX/TS, and Dart source and test files above roughly 300 lines, excluding generated files, assets, and dependency artifacts.
2. [ ] Inspect every inventory candidate enough to identify its responsibilities, test-domain scope, and any existing extracted components/modules.
3. [ ] Classify candidates as **Refactor**, **Keep cohesive**, or **Defer**, with concrete path/line evidence and risk notes.
4. [ ] Select at most one next refactor candidate and define a behavior-preserving boundary and validation approach, or state why no refactor should proceed.
5. [ ] Leave application source unchanged and do not stage any files during the audit. Preserve all existing untracked agent/environment files.
6. [ ] Run `git diff --check` and verify the only new tracked audit deliverables are this task brief, plan, and audit report.

## 6. Relevant Files

- `.agents/AGENTS.md`
- `.agents/rules/01-architecture.md`
- `docs/ai-workflow/tasks/m4-codebase-modularization/PLAN.md`
- `docs/ai-workflow/tasks/m4-codebase-modularization/STATUS.md`
- `docs/ai-workflow/tasks/m6-remaining-source-modularity-audit/AUDIT.md`

## 7. Risks & Mitigations

- **False positives from line counts:** Assess cohesion and existing extraction before recommending a split.
- **Behavioral risk from broad refactors:** Audit only; any source changes require a separate scoped implementation milestone and plan.
- **Untracked workspace pollution:** Do not touch `.agents/`, `.codex/`, supplied images, or existing workflow files; do not stage them.
