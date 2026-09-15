# Firebase Cloud Messaging (FCM) Integration & Setup Guide

Gridy uses **Firebase Cloud Messaging (FCM)** to dispatch real-time alerts to residents when:
* Document requests change status (Approved / Rejected).
* Queue tickets shift to `SERVING` status.
* Official pinned announcements are broadcasted to the entire Barangay.

This guide outlines how to generate service credentials and configure the backend for push notification processing.

---

## 🛠️ Step 1: Generate Firebase Service Account Key

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your Gridy Firebase project.
3. Click the gear icon next to **Project Overview** in the left sidebar and select **Project settings**.
4. Navigate to the **Service accounts** tab.
5. Click **Generate new private key**, then confirm by clicking **Generate key**.
6. A `.json` file containing your credentials will automatically download to your computer.

---

## ⚙️ Step 2: Configure Environment Variables

1. Save the downloaded `.json` credentials file inside the `backend/` directory or a safe local storage path.
2. Open your `backend/.env` file.
3. Reference the relative path to this key under the `FIREBASE_SERVICE_ACCOUNT_JSON` variable:

```env
FIREBASE_SERVICE_ACCOUNT_JSON=firebase-credentials-key.json
```

> [!WARNING]
> Keep the `.json` credential keys private! Do not commit them to Git. They are ignored by default via the root `.gitignore` file (`firebase-*.json`).

---

## 🔔 Step 3: Device Registration API Flow

For residents to receive push alerts on mobile devices, their clients must fetch the native device token (e.g. via Expo, Flutter FCM package) and register it in the backend:

1. **Endpoint:** `POST /api/v1/devices/`
2. **Payload:**
   ```json
   {
     "registration_id": "YOUR_NATIVE_FCM_DEVICE_TOKEN"
   }
   ```
3. **Logic:**
   * The backend registers the token and automatically maps it to the currently authenticated user profile.
   * If the token is already registered to another account (e.g., family members sharing a mobile phone), the backend safely updates the ownership to the newly authenticated user to prevent sending private alerts to the wrong resident.

---

## 🛡️ Step 4: Graceful Dev Boot (Bypass Firebase)

For development environments lacking Firebase key files, the system initiates a **Safe SDK Boot**:
* The server boots cleanly without crashing, displaying a warning message in the console:
  `Warning: Firebase service account JSON key not found. FCM notifications are disabled.`
* During code execution, if notifications are fired, the system gracefully prints a fallback logger warning inside the console and bypasses network triggers, preventing local test scripts from throwing runtime exceptions.
