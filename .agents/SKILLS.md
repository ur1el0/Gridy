# KapitBayan - Operational Playbooks & Engineering Commands

This document contains standard commands, development workflows, and operational playbooks across the KapitBayan stack (Django, React, Flutter, and PostgreSQL). Internal `gridy_*` Django app names remain unchanged.

This file contains KapitBayan development commands and operational playbooks; it is project guidance, not a list of installed third-party skills. Downloaded personal or ECC skill packages under `.agents/skills/` and generated ECC install state are local developer tooling and intentionally ignored. Keep project guidance under `.agents/` tracked. See [docs/README.md](../docs/README.md) for domain, issue-tracker, architecture, and feature documentation.

---

## 1. Development Workflows

### Option A: The Hybrid Local Workflow (Recommended)
Database runs inside Docker; application code runs directly on the host machine for optimal hot-reloading and debugging.

1. **Start Core Database (PostgreSQL):**
   ```bash
   docker compose up -d db
   ```
   *(Explicitly leaves `backend` and `frontend` offline so local host ports 8000 and 5173 remain free).*

2. **Start Django REST Backend:**
   ```bash
   ./venv/bin/python backend/manage.py runserver
   ```

3. **Start React Vite Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

---

### Option B: The Full Docker Workflow
Runs the complete 3-tier application stack containerized inside Docker Compose.

1. **Start Entire Application Stack:**
   ```bash
   docker compose up -d
   ```

2. **Restarting Backend on Code Changes:**
   ```bash
   docker compose restart backend
   ```

---

## 2. Database Management & Seeding

### Migrations
* **Host / Local Workflow:**
  ```bash
  cd backend
  python manage.py makemigrations
  python manage.py migrate
  ```
* **Docker Container Execution:**
  ```bash
  docker compose exec backend python manage.py makemigrations
  docker compose exec backend python manage.py migrate
  ```

### Database Seeding
Always seed through schema-validated management scripts. Never execute raw SQL inserts.
```bash
# Seed synthetic starter records for a local demonstration only:
./venv/bin/python backend/manage.py seed_barangays --confirm-demo-only

# Or inside running Docker container:
docker compose exec backend python manage.py seed_barangays --confirm-demo-only
```

### Superuser Creation
```bash
python manage.py createsuperuser
```

---

## 3. Mobile (Flutter) Development Playbook

### Running Mobile App
* **Web / Chrome Preview:**
  ```bash
  cd mobile
  flutter run -d chrome
  ```
* **Physical Android Device (via USB ADB):**
  1. Inspect connected hardware:
     ```bash
     flutter devices
     # or
     adb devices
     ```
  2. Bridge local Django server to device network stack:
     ```bash
     adb reverse tcp:8000 tcp:8000
     ```
  3. Launch mobile client:
     ```bash
     flutter run -d <device_id>
     ```

### Mobile Quality Gates
Execute before every git commit touching `mobile/`:
```bash
cd mobile
dart analyze
flutter test
```

---

## 4. Frontend (React) Development Playbook

### Quality Gates & Production Build
```bash
cd frontend
npm run test           # Executes Vitest test suite
npm run build          # Runs TypeScript compiler check and Vite bundle build
```

---

## 5. Backend (Django) Verification Playbook

### System Check & Test Execution
```bash
cd backend
python manage.py check
pytest
```

---

## 6. Pre-Push Verification Checklist

Always run the unified test matrix before pushing a feature branch:
1. **Backend Tests:** `pytest` (Must pass 100% with zero regressions).
2. **Frontend Tests:** `npm run test` (All Vitest suites green).
3. **Frontend Build:** `npm run build` (No TypeScript or bundling errors).
4. **Mobile Lints & Tests:** `dart analyze && flutter test` (Zero static analysis warnings).
5. **Clean Working Directory:** `git status` confirms no untracked scratch files or secrets.
