# Gridy Project Backlog

The following technical debt and DevOps tasks have been parked so we can focus on core feature completion first.

## 1. Frontend Performance (React Query)
- Status: **Parked / Defer Until Measured**
- Evaluation: Current dashboard and portal use lightweight polling and targeted fetching. Defer `@tanstack/react-query` migration until empirical performance profiling or network metrics demonstrate an actual bottleneck.

## 2. Advanced Backend Security (Rate Limiting)
- Status: **Completed / Covered Natively**
- Implementation: Native DRF `ScopedRateThrottle` is already active in `backend/config/settings.py` (line 234) with dedicated scopes (`auth_login: 10/min`, `auth_register: 20/hour`, `auth_admin_register: 5/hour`, `password_reset_request: 5/hour`, `password_reset_confirm: 10/hour`) and comprehensive test coverage in `backend/gridy_auth/tests.py` (`AuthScopedThrottleTests`). No external `django-ratelimit` dependency is required.
