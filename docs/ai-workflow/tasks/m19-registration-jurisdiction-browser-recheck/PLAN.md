# Plan: Browser Recheck of Registration Jurisdiction Label

## 1. Overview
- **Task:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `audit/registration-jurisdiction-browser-recheck`
- **Complexity:** Low

## 2. Milestone 1: Read-only Local Browser Verification
1. Confirm the exact M18 checkpoint and clean tracked worktree.
2. Start Vite on loopback only and load `/register` in an isolated headless Chrome session.
3. Inspect the rendered select's accessible name, required state, and label association through DOM and Chrome AX tree.
4. Verify keyboard reachability and visible focus without submitting the form.
5. Record page console/network results and explicit limits (no screen reader/device or axe scan unless available locally).
6. Write `AUDIT.md`, update ignored `STATUS.md`, review the report, and locally checkpoint only the M19 brief, plan, and audit.

### Validation
- `git diff --check`
- Browser observations via Chrome DevTools Protocol against `http://127.0.0.1:5173/register`
- Confirm exact staged path list and staged whitespace check before checkpoint.

### Expected outcome
The browser exposes the required select with the visible jurisdiction label as its name and keyboard users can reach it with visible focus. Any deviation becomes a finding and will guide a separate remediation milestone.

## 3. Risks and Boundaries
- Local route may depend on an API or app state; do not invent results if the browser cannot expose the registration controls.
- Browser automation bridge may be unavailable. Use isolated headless Chrome/CDP as a local fallback and document the method.
- Do not use real credentials, submit the form, write to application data, or contact production.
