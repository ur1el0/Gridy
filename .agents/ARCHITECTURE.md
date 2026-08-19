# Gridy - System Architecture

## 1. High-Level Architecture
Gridy follows a decoupled client-server architecture:
- **Frontend Client**: React Single Page Application (SPA) built with Vite and styled with Tailwind CSS.
- **Backend API**: Django REST Framework (DRF) serving JSON payloads and OpenAPI contracts.
- **Mobile Client (Future Phase)**: Flutter application for resident on-the-go access.

## 2. Infrastructure & Containerization
The backend ecosystem is fully containerized using Docker Compose:
- **`gridy_backend`**: Django application server running Gunicorn/Uvicorn.
- **`gridy_db`**: PostgreSQL relational database for persistent data storage.
- **`gridy_redis`**: Redis instance acting as the message broker for Celery and caching layer.
- **Celery Worker**: Background task processor (handled within the backend container ecosystem).

## 3. Core Technologies
- **Language**: Python 3.12+, TypeScript/JavaScript
- **Frameworks**: Django 5+, DRF, React 18+
- **Database**: PostgreSQL
- **State Management**: React Hooks, Context API
- **API Communication**: Axios with interceptors for JWT injection

## 4. Security Architecture
- **Authentication**: JWT (JSON Web Tokens) with short-lived access tokens and HttpOnly rotating refresh cookies.
- **Data Isolation**: Multi-tenant-like data filtering overriding `get_queryset()` to ensure residents only see their own records.
- **Validation**: Strict serializer validation enforcing default creation states (e.g., stripping malicious admin parameters during record creation).

## 5. Third-Party Integrations
- **Firebase Admin SDK**: Used for dispatching Firebase Cloud Messaging (FCM) Push Notifications to mobile/web clients asynchronously.
