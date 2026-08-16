# Containerization & Observability Stack Setup

This guide details the Docker containerization architecture and the observability monitoring stack (Prometheus & Grafana) used in the Gridy project.

---

## 1. Multi-Container Architecture (Docker Compose)
The `docker-compose.yml` orchestrates the entire application stack:
* **`db`**: PostgreSQL database storing the core application data.
* **`redis`**: Message broker handling asynchronous Celery tasks.
* **`web`**: Django DRF backend, serving API requests via Gunicorn.
* **`celery`**: Background worker process dedicated to asynchronous tasks (e.g., FCM notifications).
* **`frontend`**: ReactJS Single Page Application, built via a multi-stage Dockerfile and served statically through Nginx.

---

## 2. Docker Profiles
To streamline local development without running the heavy observability stack unless needed, Gridy utilizes Docker Compose profiles:
* **Core Application**: The default containers start when running `docker compose up --build`.
* **Observability Stack**: The Prometheus and Grafana containers are isolated under the `observability` profile. To spin them up alongside the core application:
  ```bash
  docker compose --profile observability up -d
  ```

---

## 3. Prometheus Metrics Pipeline
* **django-prometheus**: The Django backend is equipped with the `django-prometheus` library, which automatically hooks into database queries, cache accesses, and HTTP response latencies.
* **Scraping**: The Prometheus container (port `9090`) is configured via `prometheus.yml` to scrape the `/metrics` endpoint exposed by the Django backend every 15 seconds.

---

## 4. Grafana Dashboards
* **Visualization**: Grafana (accessible at port `3000`) is connected to Prometheus as its primary data source. 
* **Monitoring Capabilities**: It provides real-time visualization of:
  * Application Error Rates (500s)
  * API latency percentiles
  * Database query loads and connection counts
  * Active Celery tasks and queue lengths
