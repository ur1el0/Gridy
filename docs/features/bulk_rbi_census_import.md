# Feature Specification: Bulk RBI Census CSV Import

## 1. Overview
The Department of the Interior and Local Government (DILG) mandates that every barangay maintain a Registry of Barangay Inhabitants (RBI). Gridy allows barangay administrators to digitize their entire community registry in bulk by uploading standard RBI spreadsheets (CSV format), eliminating manual one-by-one account registration.

---

## 2. Technical Implementation

### 2.1 Backend Ingestion Service (`ResidentImportView`)
*   **Endpoint:** `POST /api/v1/auth/import-residents/`
*   **RBAC Enforcement:** Restricted strictly to authenticated users with the `ADMIN` role.
*   **Multi-Tenant Assignment:** Incoming resident records are automatically assigned to `request.user.barangay`. Officials cannot import residents into neighboring LGUs.
*   **Automated Verification:** Imported residents are created with `is_verified=True`, immediately qualifying them for online document requests and digital services.
*   **Duplicate Prevention:** Checks for existing usernames and emails; existing records are skipped without failing the entire batch.

### 2.2 CSV Schema Specification
The uploaded CSV file must contain the following headers:

| Header | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `full_name` | String | Legal name of resident | Juan Dela Cruz |
| `birth_date` | Date (YYYY-MM-DD) | Date of birth | 1990-05-15 |
| `purok` | String | Zone or Purok name | Purok 3 / Mabini |
| `contact_number` | String | Mobile number | 09171234567 |
| `voter_status` | Boolean | Registered voter flag (`true`/`false`) | true |

---

## 3. Frontend Ingestion Modal (`ResidentsManagement.tsx`)

### 3.1 Client-Side Features
*   **Download Template Button:** Dynamically generates and downloads a pre-formatted `residents_template.csv` file with sample rows.
*   **Drag-and-Drop Ingestion:** Accepts CSV files up to 10MB with instant filename confirmation.
*   **Progress & Summary Feedback:** Displays total imported count, skipped count, and granular validation errors.
*   **Instant Table Refresh:** Automatically reloads the local resident directory upon successful batch upload.