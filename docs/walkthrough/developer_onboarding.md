# Developer Onboarding

This guide is for local development only. Check the repository's task packet and current project files if a command differs from your working branch.

## Prerequisites

- Python 3.12 for the backend (see `backend/Dockerfile`).
- Node.js 20 and npm for the web client (see `frontend/Dockerfile` and lockfile).
- Flutter/Dart compatible with `mobile/pubspec.yaml` when working on mobile.
- Docker Compose for the full local web/API/PostgreSQL stack.

## Full local stack

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Set a local-only PostgreSQL password and matching `DATABASE_URL` in `.env`; set a local Django secret and required development settings in `backend/.env`. Keep both files untracked. Do not put production credentials in local files or commit secrets.

```bash
docker compose up --build
```

Compose runs PostgreSQL, a one-shot migration service, Django's development server, and the Nginx-served web build. Local service ports are declared in `docker-compose.yml`; do not treat this stack as a production deployment.

## Backend without Docker

```bash
python3.12 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

Configure a local `SECRET_KEY`, `DEBUG=True`, and a local `DATABASE_URL` (SQLite is the development fallback). Then:

```bash
python backend/manage.py migrate
python backend/manage.py check
python backend/manage.py runserver
```

Never use production credentials, data, media, or provider keys for local experiments. Demo seed commands have explicit safety flags and environment guards; inspect their `--help` and source before use.

## Web client

```bash
cd frontend
npm ci
npm run dev
```

The production build uses the configured `/api/v1` same-origin fallback when no explicit API URL is provided. Follow `frontend/vercel.json` and the backend environment examples carefully; the current checked-in upstream hostname values differ and need reconciliation before deployment.

## Mobile client

```bash
cd mobile
flutter pub get
flutter test
flutter run
```

Set the API endpoint using the supported `--dart-define` configuration for your local network/device. Never embed backend secrets in Flutter defines.

## API schema

With the local API running, browse `/api/schema/swagger-ui/` for the generated OpenAPI schema. See [API Specification Guide](../features/api_specification.md).
