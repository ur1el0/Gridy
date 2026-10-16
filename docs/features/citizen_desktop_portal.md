# Resident Web Portal

The resident portal is a role-guarded section of the React application mounted under `CitizenLayout`. It shares the API and account with the mobile app while providing responsive browser-based self-service.

## Current route map

| Route | Purpose |
|---|---|
| `/portal` | Redirects to the resident documents page |
| `/portal/documents` | Submit and follow document requests, inspect payment states, and access eligible documents |
| `/portal/queue` | Create/view resident queue tickets and monitor desk status |
| `/portal/bulletin` | Read announcements and community activities |
| `/portal/aid` | Submit and follow assistance requests |

Issue reporting is available through its own resident-facing workflow where routed by the current client; verify `frontend/src/App.tsx` before assuming an exact web URL. There is no hidden `Shift + \\` role-switch shortcut in the current router. Staff paths have separate role guards.

## Document and payment experience

Payment options are shown only when a request is eligible and `READY_FOR_PICKUP`. Residents can choose CASH or an available manual transfer recipient. Transfer time, reference, and receipt image are resident-submitted evidence; staff verify the transaction manually. While `PROCESSING`, payment remains unavailable and the page should explain that staff assessment is still pending. Private proof images are retrieved through authenticated APIs, not public storage URLs.

## Public information

Residents can read public announcements, activities, and queue displays.

## Authorization boundary

The portal only routes users with the `RESIDENT` role. Backend object ownership and barangay scope remain authoritative. See [ADR 008](../../architecture/decisions/008-dual-portal-role-segregated-auth.md) and [Security and RBAC](../../architecture/09-security-and-rbac.md).
