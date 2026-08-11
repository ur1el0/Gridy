# ADR 002: HttpOnly Secure JWT Cookie Authentication

## Status
Accepted

## Context
Standard single-page applications (SPAs) often store JWT access and refresh tokens in browser `localStorage`. This is insecure because any Cross-Site Scripting (XSS) attack (such as a compromised third-party npm package) can read `localStorage` and extract the resident's token keys.

## Decision
We will transition the storage of the longer-lived **Refresh Token** to a secure, server-side HTTP cookie.
- **HttpOnly**: Prevents client-side scripts from reading the cookie values.
- **Secure**: Ensures the cookie is only transmitted over HTTPS connections (disabled for local HTTP development).
- **SameSite=Strict**: Mitigates Cross-Site Request Forgery (CSRF) attacks by restricting the cookie from being sent on cross-site requests.
- **Token Rotation**: On each `/refresh/` request, the server issues a new refresh token, blacklists the old token, and updates the cookie.

## Consequences
- Protects the resident sessions from session hijacking via XSS.
- Requires custom routing handling in the frontend clients (React/Flutter) to read tokens from headers for access and cookies for refresh.
