# KapitBayan

KapitBayan is a web and mobile information and service system for barangays. The repository contains a Django REST API, a React web application for staff and resident use, and a Flutter mobile application for residents and field personnel. Internal Django package names such as `gridy_auth` remain part of the migration history and are not product names.

The platform supports resident document requests, manual fee assessment and treasury verification, queue services, assistance requests, incident reporting, communications, and public information. It records out-of-band payments but does not process funds through a payment gateway. Staff make service decisions; assistance eligibility and document approval are not automated.

## Architecture and API

- Backend: Django and Django REST Framework in `backend/`.
- Web: React, TypeScript, and Vite in `frontend/`.
- Mobile: Flutter in `mobile/`.
- Database: PostgreSQL for hosted use; local and test setups may use SQLite.
- Exact endpoint contracts: generated OpenAPI at `/api/schema/` and Swagger UI at `/api/schema/swagger-ui/` when the API is running.
- Database schema and migrations: Django models and migration files. Do not infer schema from historical documentation.

The web client is configured for a same-origin API proxy, while mobile clients call the configured API URL. Private identity and payment evidence is served through authenticated backend views; never construct public evidence URLs. The Public Information AI Navigator uses only approved public information and is disabled by default. Hosting and service behavior must be verified against the active deployment before being described as live.

## Documentation

Start at the [documentation index](docs/README.md) for current architecture, decision records, feature guides, and walkthroughs. The [ADR index](architecture/decisions/README.md) records the accepted architectural decisions. Use the generated OpenAPI schema for exact request/response details.

`skills-lock.json` is tracked metadata containing upstream skill sources and hashes for reproducible local installation. Downloaded skills under `.agents/skills/` and generated ECC install state are local tooling, not repository source. Project-level `.agents/` guidance remains tracked.

## Local development with Docker Compose

Requirements: Docker Compose and Git.

1. Copy the example files and set a local-only PostgreSQL password plus a matching `DATABASE_URL` in `.env`:

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

2. Set a local Django secret in `backend/.env`. Keep both environment files untracked; do not put production credentials in a local file or container image.
3. Start the local stack:

   ```bash
   docker compose up --build
   ```

Compose starts PostgreSQL, runs migrations in a one-shot service, then starts Django's development server and the Nginx-served web build. It is for local development and demos, not production. Ports and service names are defined in `docker-compose.yml`.

## Run clients without Docker

### Backend

```bash
python3.12 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
python backend/manage.py migrate
python backend/manage.py check
python backend/manage.py runserver
```

Configure a local `SECRET_KEY` and development database in the ignored `backend/.env`. Do not run seed or demo commands against deployed databases; each command's explicit safety options and environment guards must be respected.

### Web

```bash
cd frontend
npm ci
npm run dev
```

### Mobile

```bash
cd mobile
flutter pub get
flutter run
```

Configure the mobile API URL for the device/emulator using the supported build define. Do not embed provider credentials in a client build.

## Verification commands

Run relevant suites for changed code and follow the task packet's required validation:

```bash
./venv/bin/pytest backend
npm --prefix frontend run lint
npm --prefix frontend run test -- --run
npm --prefix frontend run build
cd mobile && flutter analyze && flutter test
```

These are example commands, not a report that the current checkout has passed them. Record actual output and any unavailable checks in the active task status.
