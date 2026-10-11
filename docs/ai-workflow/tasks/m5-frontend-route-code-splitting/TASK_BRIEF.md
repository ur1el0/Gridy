# Task Brief: Frontend Route-Level Code Splitting

## 1. Metadata

- **Task ID:** `m5-frontend-route-code-splitting`
- **Task Type:** Performance refactor
- **Target Component:** Frontend web (React/Vite)
- **Lead / Implementer / Reviewer:** Codex (temporary sole-agent mode)
- **Branch:** `perf/frontend-route-code-splitting`

## 2. Objective & Scope

- **Goal:** Reduce the JavaScript loaded for the initial application entry by splitting route page modules into on-demand chunks while preserving all existing routes, redirects, role guards, and layouts.
- **Non-goals:** No API or business-logic changes, package additions, visual redesign, image optimization, production deployment, or unrelated page refactors.
- **Context:** The latest recorded production build in `docs/ai-workflow/tasks/m4-codebase-modularization/STATUS.md` emitted a 991.55 kB main JavaScript chunk, above Vite's 500 kB advisory threshold. `frontend/src/App.tsx` statically imports every page module, including pages used only by protected or infrequently visited routes. The current generated entry asset is 991,677 bytes.

## 3. Current Behavior & Evidence

- `frontend/src/App.tsx` imports all route pages statically and places them directly into `<Routes>`.
- `frontend/dist/assets/index-BxM5jhmi.js` is 991,677 bytes in the current generated output; M4's recorded build measured the main chunk at 991.55 kB.
- `frontend/src/App.test.tsx` tests the login page directly but does not exercise the `App` route table or route-level loading.

## 4. Required Rules

- Preserve every URL, route element, nested layout, redirect, and `ProtectedRoute` role list exactly.
- Keep `AuthProvider`, router, layouts, route guards, and error boundary behavior intact.
- Add an accessible loading state for lazy route transitions; rejected chunk loads must continue to reach the existing `ErrorBoundary`.
- Add no dependency and make no backend, schema, or environment-variable changes.

## 5. Observable Acceptance Criteria

1. [ ] Route page components are loaded with dynamic imports; shared app providers, layouts, and guards retain their current behavior.
2. [ ] An accessible pending state is rendered while a route page chunk loads, with a focused test proving it remains visible until the chunk resolves.
3. [ ] An integration test verifies that an unauthenticated visit to `/` still redirects to and renders the login page through the lazy route table.
4. [ ] Production build emits separate route/page chunks and the initial JavaScript entry is below Vite's 500 kB advisory threshold; any remaining chunk warnings are inspected and recorded.
5. [ ] Frontend lint, tests, production build, and `git diff --check` pass.
6. [ ] No unrelated files are staged or included in the local milestone checkpoint; `.agents/`, `.codex/`, supplied JPEGs, and other untracked content remain untouched.

## 6. Relevant Files

- `frontend/src/App.tsx`
- `frontend/src/App.test.tsx`
- `frontend/src/components/core/RouteLoadingFallback.tsx`
- `frontend/src/components/core/RouteLoadingFallback.test.tsx`
- `docs/ai-workflow/tasks/m5-frontend-route-code-splitting/PLAN.md`
- `docs/ai-workflow/tasks/m5-frontend-route-code-splitting/STATUS.md` (local status log; `STATUS.md` is ignored by repository policy)

## 7. Risks & Mitigations

- **Deep-link and auth regressions:** Preserve route declarations and guard nesting, and add an `App`-level route test.
- **Loading flash on slow connections:** Use a small accessible fallback inside the existing error boundary and provider tree.
- **Chunk remains oversized:** Inspect generated chunk sizes after the build; only add a further split if the build evidence identifies a specific large module.
- **Generated assets:** `frontend/dist/` is build output and must not be staged.
