# Asynchronous Task Queue Setup (Celery & Redis)

This guide outlines the integration of Celery and Redis into the Gridy backend architecture to handle asynchronous background tasks.

---

## 1. Why Celery & Redis?
Gridy interfaces with multiple external systems (e.g., Firebase Cloud Messaging, Cloudinary, Email SMTP). Performing these network calls synchronously during an HTTP request blocks the Django server thread, leading to slow response times and potential timeouts for users. 

By offloading these tasks to a background worker (Celery) using an in-memory message broker (Redis), the API can respond instantly while the heavy lifting happens behind the scenes.

---

## 2. Infrastructure Setup
* **Redis**: Acts as the message broker. Django sends task metadata to Redis, which holds it in a queue.
* **Celery Worker**: A separate Python process constantly polls the Redis queue. When it finds a task, it executes it asynchronously.

---

## 3. Configuration Highlights
* **`backend/config/celery.py`**: Initializes the Celery app, binding it to Django's settings module.
* **`backend/config/settings.py`**: Configures the `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` to point to the Redis instance (`redis://redis:6379/0`).

---

## 4. Implemented Background Tasks
The following operations have been successfully decoupled from the main HTTP thread:
1. **FCM Notifications (`@shared_task`)**: Triggered when a document request changes status or a queue ticket is called.
2. **Scheduled Activities**: Triggering daily summaries or future event reminders (implemented via Celery Beat, if configured).

---

## 5. Development Workflow
To run the background workers locally (without Docker):
1. Ensure a local Redis server is running on port `6379`.
2. Open a new terminal, navigate to the `backend/` directory.
3. Run the worker process:
   ```bash
   celery -A config worker --loglevel=info
   ```
