# ADR 008: Dual-Portal UI Segregation with Secret Role-Switching Barrier

## Status
Accepted

## Context
A unified municipality web client serves two diametrically opposed personas:
1. **Constituents / Residents**: Need a simple, distraction-free self-service portal for clearances, incident reports, and queue tickets.
2. **Barangay Staff & Executives**: Require complex management tables, financial auditing, triage controls, and census imports.

Exposing administrative interfaces directly on the public login view invites credential stuffing attacks and creates UX clutter for ordinary residents. Furthermore, in multi-role administrative environments and field auditing workflows, repeatedly logging out and logging in across different authorization levels creates operational friction.

## Decision
We engineered a **Dual-Portal Segregated Architecture**:
1. **Resident-First Default Landing**: The root application (`/`) and primary desktop experience default to the Citizen Desktop Portal (`/portal/documents`, `/portal/queue`, `/portal/bulletin`, `/portal/issues`) wrapped in `CitizenLayout`.
2. **Administrative Isolation**: The Executive Desk is mounted on `/admin/*` and strictly guarded by `ProtectedRoute` verifying `user.role in [Role.ADMIN, Role.DILG_ADMIN]`.
3. **Secret Demarcation & Presentation Gateway**:
   - **Desktop Shortcut**: Pressing `Shift + \` invokes a hidden toggle dialog across web pages.
   - **Mobile Gesture**: Long-pressing the brand header logo for 3 seconds activates the gesture listener.
   - **Permission Boundary**: The toggle barrier explicitly interrogates the authenticated user's session claims. Standard resident accounts cannot access `/admin/*` even if they trigger the shortcut; unauthorized attempts trigger security alerts.

## Consequences
* **Positive**: Delivers a clean, government-standard constituent experience without exposing internal administrative tools.
* **Positive**: Enables seamless, single-browser operational switching during administrative audits and stakeholder demonstrations.
* **Positive**: Mitigates opportunistic probing and visual clutter on the public interface.
* **Negative**: Requires careful listener cleanup (`keydown` and gesture event listeners in React `useEffect` hooks) to prevent memory leaks and duplicate handler bindings.