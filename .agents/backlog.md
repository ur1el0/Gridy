# Gridy Project Backlog

The following technical debt and DevOps tasks have been parked so we can focus on core feature completion first.

## 1. Frontend Performance (React Query)
- Remove manual `useEffect` data fetching in the React frontend.
- Implement `@tanstack/react-query` to automatically cache data and optimize state management.

## 2. Advanced Backend Security (django-ratelimit)
- Install and configure `django-ratelimit`.
- Protect the `/auth/login/` and `/auth/register/` endpoints from brute-force bot attacks.
