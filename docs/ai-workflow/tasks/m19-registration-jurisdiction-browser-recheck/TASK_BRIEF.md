# Task Brief: Browser Recheck of Registration Jurisdiction Label

## 1. Metadata
- **Task ID:** `m19-registration-jurisdiction-browser-recheck`
- **Task Type:** Accessibility audit / browser verification
- **Target Component:** React resident registration form
- **Lead / Writer:** Codex (user-directed single-agent mode)
- **Branch / Base:** `audit/registration-jurisdiction-browser-recheck` / M18 checkpoint `63ab04a`

## 2. Objective and Scope
- **Goal:** Verify in a local browser that the M18 label fix exposes `LOCAL BARANGAY JURISDICTION` as the required select's accessible name and remains keyboard operable.
- **Non-goals:** No application-code edits, account registration, form submission, production access, deployment, push, or screenshot added to the repository.
- **Context:** M17's Chrome AX tree found the required select unnamed (A11Y-05). M18 added `useId()` and a native label association with an automated regression test.

## 3. Evidence and Method
- Inspect M17's recorded browser evidence and M18's committed source/test.
- Serve the current branch locally and use Chrome DevTools Protocol to inspect the `/register` page, AX tree, keyboard focus, console, and network activity.
- Browser DevTools MCP has returned `Target closed`; if it remains unavailable, use isolated headless Chrome with a local CDP connection.

## 4. Acceptance Criteria
1. [ ] The visible `LOCAL BARANGAY JURISDICTION` label appears as the accessible name of its required combobox in Chrome's accessibility tree.
2. [ ] The select is reachable by keyboard and receives visible focus; no registration or form submission is performed.
3. [ ] Local page assets load without relevant console errors or failed local requests.
4. [ ] Findings distinguish direct browser observations from checks not available (for example screen-reader/device and axe-core).
5. [ ] An audit report records concrete evidence; only the M19 task packet/report is checkpointed, leaving unrelated untracked environment files untouched.

## 5. Rules and Constraints
- Read-only audit; no source/config/test modifications in this milestone.
- Use local app only, no credentials or PII.
- Keep generated browser artifacts in `/tmp`; do not add screenshots or logs containing sensitive content to the repository.
- Do not stage `.agents/`, `.codex/`, supplied logo JPEGs, or unrelated task files.
- No deployment, push, or production access.
