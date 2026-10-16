# Firebase Cloud Messaging Setup

KapitBayan can register mobile device tokens and send push notifications through Firebase Cloud Messaging when the required Firebase configuration is available. Provider credentials and project identifiers are environment-specific; this guide does not prescribe a project ID.

## Credential handling

1. Use an authorized Firebase project and create a service account according to the project's current Google/Firebase administration policy.
2. Store the JSON service-account key outside the repository and outside the container image.
3. Configure `FIREBASE_SERVICE_ACCOUNT_JSON_PATH` as an absolute path to the mounted key in an approved environment. Keep local keys ignored and never commit or paste them into chat/issues.
4. Configure the matching Firebase client settings for the mobile build through the supported platform-specific process.

The backend key and client configuration are different artifacts. Never use the service-account JSON in a web or mobile client.

## Device registration and delivery

The mobile client obtains an FCM registration token using Firebase Messaging and registers it through the authenticated device endpoint (`POST /api/v1/devices/`). Use the serializer and generated OpenAPI schema for the exact field contract.

Push delivery is best-effort in the current backend. A successful API action does not prove that Firebase accepted or delivered a message, and an in-process send can be interrupted by a restart. Validate delivery with a test device and Firebase diagnostics in a non-production environment; do not use real resident records for testing.

## Local and production checks

Local startup behavior depends on Django settings and whether the configured key is present and valid. Inspect the current app initialization and test expectations rather than assuming Firebase is always silently disabled. Production secret validation and file mounting must match the deployment platform. See [In-Process Background Work](async_tasks_setup.md) and [Deployment and Observability](deployment_observability.md).
