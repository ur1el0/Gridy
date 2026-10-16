# Cloud Services and External Integrations

External services are optional runtime integrations configured by environment. Their presence in code or deployment files does not prove that credentials, billing, production configuration, or live delivery are active.

## Media storage

The configured default storage backend may use Cloudinary. When authenticated Cloudinary storage is configured, resident identity, billing, and payment-proof files are private and served through permission-checked Django views. Local development has a protected media view for sensitive directories. Do not copy a private file's storage key or construct a public URL in API responses or documentation. Incident-report images have a distinct policy and must be checked against the current model/storage implementation before describing access.

## Firebase Cloud Messaging

The mobile client can register a Firebase device token and the backend may send push notifications when Firebase Admin credentials are configured. Notification work currently runs in-process and is best-effort; an accepted API request is not proof that a provider delivered the notification. Do not put Firebase service-account credentials in a client bundle or commit them to the repository.

## Email and AI provider

Email uses the configured SMTP settings. The Public Information Navigator may call the configured Gemini provider from the server only. Its API key is supplied through server environment configuration; it is never placed in a browser/mobile build. The navigator is disabled by default and does not send private resident or service records to the model. See [ADR 019](decisions/019-public-information-ai-navigator-boundary.md).

## Deliberate infrastructure limits

The current architecture does not require Celery, Redis, or a vector database. PostgreSQL stores application data; retrieval for the navigator uses the approved public records and in-process construction. Azure remains a separately gated proposal and is not implied by these integration notes. See [ADR 009](decisions/009-simplification-to-defended-proposal-architecture.md) and [Deployment](11-deployment-and-ci-cd.md).
