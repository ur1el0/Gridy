# Plan: Registration Form Accessibility Sweep

## 1. Overview
- **Task brief:** [TASK_BRIEF.md](TASK_BRIEF.md)
- **Branch:** `audit/registration-form-accessibility-sweep`
- **Complexity:** Medium; read-only browser and source audit.

## 2. Milestone 1: Inspect Resident and Official Registration States
1. Read the relevant registration page/components and identify safe, local UI-only state changes.
2. Start Vite bound to `127.0.0.1`; load `/register` in isolated headless Chrome.
3. Inspect the browser AX tree and DOM for all resident controls, names, and applicable required/disabled states.
4. Expand the evidence disclosure and use Tab navigation to assess file-control reachability and focus visibility without choosing files.
5. Switch to official registration mode only if it is a local toggle; inspect its controls, names, and applicable required/disabled states without filling them.
6. Record actual runtime evidence, test limits, and any findings in `AUDIT.md` and ignored `STATUS.md`.
7. Review the exact report and locally checkpoint only M20 task/report files.

### Validation
- Chrome DevTools Protocol accessibility tree, keyboard events, console and network events against `http://127.0.0.1:5173/register`.
- `git diff --cached --check` on the exact three-file packet.

## 3. Risks and Rollback
- Browser state may hide controls until an accordion or registration-mode toggle is activated; inspect source before interacting.
- Local public directory fetches may fail if the backend is stopped. Record this as an environment limit without creating data or altering backend state.
- No screen-reader/device or full conformance claim is in scope.
