# Task Brief: Post-Modularity Source Audit

## 1. Metadata

- **Task ID:** `m13-post-modularity-audit`
- **Task Type:** Read-only architecture audit
- **Target Components:** Backend, frontend, and mobile source modules
- **Lead / auditor:** Codex (temporary sole-agent mode)
- **Branch:** `audit/post-modularity-rescan`

## 2. Objective & Scope

- **Goal:** Re-inventory large source and test modules after M7–M12 and determine which remaining files, if any, have a concrete domain boundary that merits another refactor.
- **Non-goals:** No application or test source edits, no configuration changes, no commits containing source, no production actions, and no edits to `.agents/`, `.codex/`, or unrelated task files.
- **Context:** Since M6, service serializers were split, authentication media tests were separated, and citizen documents/dashboard UI was decomposed. M6 findings must be reassessed against current files rather than copied forward.

## 3. Audit Questions

- Which tracked `.py`, `.ts`, `.tsx`, and `.dart` source/test files currently exceed 300 lines?
- Which previous M6 findings were addressed, and which are still current?
- Are any remaining large files truly cross-domain, or are they cohesive workflows with extracted presentation?
- What is the next justified implementation task, if one exists?

## 4. Observable Acceptance Criteria

1. [ ] Current line-count inventory is generated from repository files and excludes migrations/build artifacts from source candidates.
2. [ ] Each remaining file above 300 lines is classified as refactor, defer, or keep cohesive with concrete evidence.
3. [ ] M6 recommendations are reconciled with M7–M12 commits and current code.
4. [ ] Frontend read-only baseline checks pass; no application/test source is modified.
5. [ ] No unrelated paths are staged; local agent/environment files remain untouched.

## 5. Relevant Files

- `docs/ai-workflow/tasks/m6-remaining-source-modularity-audit/AUDIT.md`
- `docs/ai-workflow/tasks/m7-services-serializer-package/`
- `docs/ai-workflow/tasks/m8-auth-media-test-split/`
- `docs/ai-workflow/tasks/m9-citizen-documents-modal/`
- `docs/ai-workflow/tasks/m10-citizen-payment-form/`
- `docs/ai-workflow/tasks/m11-admin-dashboard-components/`
- `docs/ai-workflow/tasks/m12-citizen-request-rows/`
- `docs/ai-workflow/tasks/m13-post-modularity-audit/AUDIT.md`

## 6. Constraints & Risks

- File length alone is not evidence of a god file; inspect class/function/component boundaries and callers.
- Preserve historical M6 results as historical evidence; report current counts separately.
- Audit commands must remain read-only and no existing untracked environment content may be changed or staged.
