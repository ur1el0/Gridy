# Gridy Backend Developer Onboarding and Setup Guide

This document guides developers through setting up the local development environment for the Gridy Django REST Framework backend.

---

## Prerequisites

Before setting up the project, ensure you have the following installed on your machine:
* Python 3.10 or higher
* pip (Python package installer)
* virtualenv (Python virtual environment manager)
* Git

---

## Local Environment Setup

### 1. Clone and Navigate to the Repository
Navigate to the root directory of the Gridy project:
```bash
cd Gridy
```

### 2. Configure the Virtual Environment
Create a virtual environment to isolate the project dependencies:
```bash
python -m venv venv
```

Activate the virtual environment:
* On Linux/macOS:
  ```bash
  source venv/bin/activate
  ```
* On Windows:
  ```bash
  venv\Scripts\activate
  ```

### 3. Install Dependencies
Install all required Python packages:
```bash
pip install -r backend/requirements.txt
```

---

## Environment Variables Configuration

Create an environment configuration file `.env` inside the `backend/` directory by copying the provided template:
```bash
cp backend/.env.example backend/.env
```

Ensure the following core variables are configured:
```env
# General Settings
SECRET_KEY=your_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration (Defaults to SQLite if empty)
DATABASE_URL=

# CORS Settings
CORS_ALLOW_ALL_ORIGINS=True

# Cloudinary Credentials (CDN & Media Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase Admin SDK Configuration (FCM)
FIREBASE_SERVICE_ACCOUNT_JSON_PATH=firebase-credentials-key.json
```

---

## Database Migrations & Initial Seeding

Apply database schema changes to prepare the local SQLite database:
```bash
python backend/manage.py makemigrations
python backend/manage.py migrate
```

Seed the default barangay administrative entities, fee schedules, and initial fixtures:
```bash
python backend/manage.py seed_barangays
```

Create a superuser account to access the Django administration console:
```bash
python backend/manage.py createsuperuser
```

---

## Running the Server

Start the local development server:
```bash
python backend/manage.py runserver
```
The server will start running at `http://127.0.0.1:8000/`.

---

## Verification and Testing

1. **System Health Check:**
   Verify that all installed apps, database drivers, and models compile cleanly:
   ```bash
   python backend/manage.py check
   ```

2. **Automated Test Suite (Pytest):**
   Run the comprehensive test suite (40 unit and integration tests covering authentication, RBAC, treasury audits, and reporting):
   ```bash
   pytest backend
   ```