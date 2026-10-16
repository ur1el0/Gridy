# KapitBayan - Troubleshooting Runbook

This runbook documents known runtime failure modes, operational pitfalls, and validated remediation procedures across the KapitBayan application stack.

---

## 1. The "Stale Docker Trap" (Port 8000 Conflict & 500 Server Errors)

### Symptoms
* Local code changes in `backend/` are not taking effect.
* Browser or curl returns `500 Internal Server Error` referencing file paths inside `/app/` instead of your local repository directory.
* `python manage.py runserver` fails with `Error: That port is already in use.`

### Root Cause
A dormant or background Docker container (`gridy_backend`) is holding host port `8000`, intercepting HTTP requests with stale, non-reloaded code while the developer attempts to test local changes.

### Remediation
```bash
# 1. Stop conflicting Docker application servers
docker compose stop backend frontend

# 2. Verify port 8000 is cleared
lsof -i :8000

# 3. Resume hybrid local workflow
cd backend
python manage.py runserver
```

---

## 2. Physical Android Device Mobile Networking (`ERR_CONNECTION_REFUSED`)

### Symptoms
* Flutter app on physical Android phone cannot sign in or fetch tickets, throwing connection timeouts or `SocketException: Connection refused`.

### Root Cause
A physical mobile device operates on an independent network interface. Calling `http://localhost:8000` or `http://127.0.0.1:8000` on the phone queries the phone's loopback rather than the host computer running Django.

### Remediation
Reverse port forwarding over USB via ADB:
```bash
# Verify device is recognized
adb devices

# Route phone's port 8000 back to host's port 8000
adb reverse tcp:8000 tcp:8000
```
*(For Android Emulators: Use `http://10.0.2.2:8000` instead of `localhost:8000`).*

---

## 3. Database Migration Inconsistencies & Container Locks

### Symptoms
* `django.db.utils.OperationalError: could not connect to server: Connection refused`.
* Database table does not exist or relation is out of sync after switching branches.

### Root Cause
* Docker database (`gridy_db`) is not running.
* Migrations were generated locally but applied to a temporary host SQLite instance instead of the containerized PostgreSQL database.

### Remediation
```bash
# 1. Ensure PostgreSQL container is running and healthy
docker compose up -d db

# 2. Apply migrations against active PostgreSQL instance
cd backend
python manage.py makemigrations
python manage.py migrate

# 3. If running purely within Docker:
docker compose exec backend python manage.py migrate
```

---

## 4. Background Task (FCM & Email) Debugging

### Symptoms
* Push notifications (FCM) or welcome emails are not arriving.
* Client request returns 200 OK, but background dispatch failed.

### Root Cause
* Celery and Redis have been decommissioned in favor of native Python daemon threads (`@async_task`).
* If a background thread fails, the error is caught defensively and logged via Python `logging` without crashing the main HTTP response thread.
* Most common cause: Missing or invalid Firebase service account key (`FIREBASE_SERVICE_ACCOUNT_JSON_PATH`) or invalid SMTP email credentials.

### Remediation
```bash
# 1. Check application logs for background thread error traces
docker compose logs -f backend | grep -E "(Failed to send welcome email|Background Task Failed)"

# 2. Verify Firebase credentials exist in .env
cat backend/.env | grep FIREBASE_SERVICE_ACCOUNT_JSON_PATH
```

---

## 5. JWT Cookie Boundary & CORS Failures

### Symptoms
* Silent token refresh fails; user is kicked back to login unexpectedly.
* `LogoutView` returns `400 Bad Request` or CORS header error.

### Root Cause
* Refresh token cookie defaults to `HttpOnly; SameSite=Strict`. Cookie delivery depends on matching host/origin, CSRF, and proxy configuration.
* Logout endpoint previously expected `refresh_token` in body; hardened `LogoutView` now gracefully invalidates without throwing 400 if cookie is absent.

### Remediation
1. Confirm the frontend and API hostnames, cookie path, forwarded HTTPS headers, and CSRF trusted origins; do not change SameSite or widen CORS as a first response.
2. Check `CORS_ALLOWED_ORIGINS`, cookie settings, and CSRF settings in `backend/config/settings.py`. The intended production web topology uses the same-origin proxy; verify its upstream host and headers.

---

## 6. Mobile RenderFlex Viewport Overflow

### Symptoms
* Yellow-and-black striped overflow banner displayed on screen when on-screen keyboard appears.
* Widget test failure: `A RenderFlex overflowed by ... pixels`.

### Root Cause
Form widgets enclosed in fixed height columns without a scrollable viewport contract when software keyboards take screen real estate.

### Remediation
Wrap screen form content in `LayoutBuilder`, `SingleChildScrollView`, `ConstrainedBox`, and `IntrinsicHeight`:
```dart
SafeArea(
  child: LayoutBuilder(
    builder: (context, constraints) {
      return SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight),
          child: IntrinsicHeight(
            child: Column(...),
          ),
        ),
      );
    },
  ),
)
```
In widget tests, always invoke `await tester.pumpAndSettle()` to ensure animations and layout calculations settle before making assertions.
