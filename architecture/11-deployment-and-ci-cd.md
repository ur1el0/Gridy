# 11 Deployment & CI/CD Pipeline

## 1. Hosting Infrastructure & Origin Topology

Gridy is configured for an intended **Same-Origin Reverse Proxy Architecture** for its production web deployment to guarantee robust cookie security and eliminate third-party cookie restrictions:

*   **Backend & Database:** Deployed on **Render.com**. Render provides a managed PostgreSQL instance and auto-deploys the Django backend from the `main` branch.
    *   **Production API Hostname:** `https://gridy-backend.onrender.com`
*   **Frontend Web Application:** Hosted on **Vercel** as a single-page application (SPA).
    *   **Production Frontend Hostname:** `https://gridy.vercel.app`
*   **Reverse Proxy Contract:**
    *   Vercel Edge Rewrites (`frontend/vercel.json`): Rewrites all `/api/v1/:path*` requests directly to `https://gridy-backend.onrender.com/api/v1/:path*`.
    *   Containerized Stack (`frontend/nginx.conf`): Nginx reverse proxies `/api/` traffic directly to `http://backend:8000`.
    *   Client URL Resolution (`frontend/src/api/axios.ts`): Resolves `VITE_API_BASE_URL` to relative `/api/v1` in production when unset. Any configured environment variable overrides this fallback.

---

## 2. Security Boundaries & Cookie Policy

Under this configured topology, web browser traffic targets `/api/v1` on the frontend domain, allowing the browser to treat authentication exchanges as **same-origin**:

*   **Refresh Token Cookie:**
    *   `SameSite=Strict`: Protects against cross-site request forgery without third-party cookie blocking issues.
    *   `Path=/api/v1/auth/`: Scopes token transmission exclusively to authentication endpoints (`/login/`, `/token/refresh/`, `/logout/`).
    *   `HttpOnly=True`: Inaccessible to JavaScript memory (`localStorage`/`sessionStorage`).
    *   `Secure=True`: Enforced automatically in production when `DEBUG=False`.
*   **Host & Origin Allowlists (Backend):**
    *   `ALLOWED_HOSTS`: Validates the canonical backend host `gridy-backend.onrender.com` and local development hosts. Broad platform wildcards (`.onrender.com`, `.vercel.app`) are rejected.
    *   `CSRF_TRUSTED_ORIGINS`: Configured specifically with `https://gridy.vercel.app`, `https://gridy-backend.onrender.com`, and local development origins. Arbitrary platform subdomains are not trusted.
    *   `CORS Policy`: Web browser clients communicate via the same-origin reverse proxy and do not invoke CORS. Native mobile applications (Flutter) do not run within a browser sandbox and do not use CORS. Broad production regexes are removed; `CORS_ALLOWED_ORIGINS` accepts only explicitly configured origins.

---

## 3. Environment Management

Strict separation of configuration across environments:
*   `SECRET_KEY` & `ADMIN_REGISTRATION_PASSKEY`
*   `DATABASE_URL` (PostgreSQL connection string)
*   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, & `CLOUDINARY_API_SECRET`
*   `FIREBASE_SERVICE_ACCOUNT_JSON_PATH` (mounted as a Secret File on Render)
*   `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, & `DEFAULT_FROM_EMAIL`
*   `VITE_API_BASE_URL` (leave unset or `/api/v1` for production same-origin builds; `http://127.0.0.1:8000/api/v1` for local development)
*   `REFRESH_COOKIE_SAMESITE` (defaults to `Strict`)

---

## 4. Mobile Distribution

*   The Flutter application compiles into an Android `.apk` (and optionally an iOS `.ipa`).
*   Mobile clients connect directly to the API endpoint (`https://gridy-backend.onrender.com/api/v1`) via `--dart-define=API_BASE_URL`. Because mobile HTTP clients are not subject to browser origin controls, they do not require or use CORS permissions.
*   For staged LGU field rollouts, direct APK distribution via GitHub Releases or Firebase App Distribution is utilized.
