# ADR 005: Stateful Session Revocation & Ghost State Mitigation

## Status
Accepted

## Context
Standard JSON Web Tokens (JWT) are stateless. Once a server mints an access token, it cannot be cryptographically revoked until its expiration time elapses. If a user changes their password, or logs out on a shared LGU computer, their previous tokens remain fully capable of reading and modifying the database (a critical "Ghost State" vulnerability).

## Decision
We implemented a hybrid state-backed session architecture:
1. **Short-lived Access Tokens:** Sent in memory, valid for a brief window.
2. **Long-lived Refresh Tokens:** Delivered exclusively via `HttpOnly` secure browser cookies, shielding them from Cross-Site Scripting (XSS) extraction.
3. **Database State Tracking:** Every issued refresh token creates a `RefreshSession` row in the Postgres database.
4. **Active Revocation (Backend):** When a user triggers `/auth/change-password/` or `/auth/logout/`, the backend queries the `RefreshSession` table and flips `is_revoked = True`.
5. **Active Flushing (Frontend):** The React SPA overrides standard `localStorage` clearing by actively pinging the backend during the logout lifecycle, forcing the browser to destroy the `HttpOnly` cookie vault.

## Consequences
* **Positive:** Complete immunity to session hijacking on shared devices.
* **Positive:** Guaranteed invalidation of all existing sessions when a user's credentials are rotated or their account is deleted.
* **Negative:** Slight performance penalty. Refreshing a token now requires an active database lookup to verify the `is_revoked` boolean, rather than relying solely on stateless cryptographic math.
