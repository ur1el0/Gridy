# 11 Deployment & CI/CD Pipeline
## 1. Hosting Infrastructure
*   **Backend & DB:** Deployed on **Render.com**. Render provides a managed PostgreSQL instance and auto-deploys the Django backend whenever changes are pushed to the `main` branch of the GitHub repository [cite: 7].
*   **Frontend Web:** Hosted on **Vercel** or Render as a static site, offering global edge caching for lightning-fast dashboard load times [cite: 7].

## 2. Environment Management
Strict separation of `.env` files for development and production [cite: 7]. Production secrets securely injected into Render/Vercel include:
*   `DJANGO_SECRET_KEY`
*   `DATABASE_URL`
*   `CLOUDINARY_API_KEY` & `CLOUDINARY_API_SECRET`
*   `FIREBASE_SERVICE_ACCOUNT_JSON`

## 3. Mobile Distribution
*   The Flutter application will be compiled into an Android `.apk` (and optionally an iOS `.ipa`) [cite: 7].
*   For staged LGU field rollouts, direct APK distribution via GitHub Releases or Firebase App Distribution is utilized.
