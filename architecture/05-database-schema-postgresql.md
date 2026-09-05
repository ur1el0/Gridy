# 05 Database Schema (PostgreSQL)

## 1. RDBMS Strategy
PostgreSQL is utilized as the primary relational database to enforce absolute data integrity via explicit foreign keys, check constraints, and unique fields. To support the live dashboard and real-time scanning updates, index headers are configured on high-velocity tables.

## 2. Table Schemas

### 2.1 Table: `users_user`
Extends Django's `AbstractUser` to support role-based user records.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | PRIMARY KEY | Unique ID |
| `username` | `VARCHAR(150)` | UNIQUE, NOT NULL | Login name |
| `password` | `VARCHAR(128)` | NOT NULL | PBKDF2 hash password |
| `role` | `VARCHAR(20)` | NOT NULL | `'ADMIN'` or `'RESIDENT'` |
| `is_active` | `BOOLEAN` | DEFAULT TRUE | Account state |

### 2.2 Table: `residents_resident`
Stores identity profile details of registered residents.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `resident_id` | `SERIAL` | PRIMARY KEY | Unique resident profile ID |
| `user_id` | `INTEGER` | UNIQUE, FK (`users_user`), ON DELETE CASCADE | Associated login account |
| `full_name` | `VARCHAR(255)` | NOT NULL | Full resident name |
| `birth_date` | `DATE` | NOT NULL | Date of birth |
| `voter_status`| `BOOLEAN` | DEFAULT FALSE | Voter registration flag |
| `contact_number` | `VARCHAR(20)` | NULL | Mobile/telephone contact |

### 2.3 Table: `communications_announcement`
Stores official barangay announcements.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | PRIMARY KEY | Unique announcement ID |
| `title` | `VARCHAR(200)` | NOT NULL | Announcement heading |
| `category` | `VARCHAR(30)` | NOT NULL | `'AID'`, `'MEDICAL'`, `'EVENT'`, or `'GENERAL'` |
| `content` | `TEXT` | NOT NULL | Body copy text |
| `scheduled_date`| `TIMESTAMP WITH TIME ZONE` | NOT NULL | Display schedule timestamp |

### 2.4 Table: `services_queue`
Manages the hybrid queue tickets and real-time dashboard status.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `ticket_id` | `SERIAL` | PRIMARY KEY | Unique ticket ID |
| `resident_id`| `INTEGER` | FK (`residents_resident`), NULL, ON DELETE SET NULL | Associated resident (null for anonymous/walk-in) |
| `service_type`| `VARCHAR(50)` | NOT NULL | Purpose of queue (e.g., `'clearance'`) |
| `priority` | `VARCHAR(20)` | NOT NULL | `'REGULAR'` or `'SENIOR_PWD'` |
| `status` | `VARCHAR(20)` | DEFAULT `'WAITING'`, NOT NULL | `'WAITING'` or `'SERVED'` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT NOW(), NOT NULL | Timestamp generated upon slip print |

*Note: Database indexes are explicitly declared on `(status, created_at)` to optimize real-time polling queries.*

### 2.5 Table: `reports_issue`
Maintains records of resident reported local issues.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `report_id` | `SERIAL` | PRIMARY KEY | Unique issue report ID |
| `resident_id`| `INTEGER` | FK (`residents_resident`), ON DELETE CASCADE | Submitted by |
| `title` | `VARCHAR(200)` | NOT NULL | Issue header |
| `description`| `TEXT` | NOT NULL | Comprehensive explanation |
| `location` | `VARCHAR(255)` | NOT NULL | Geoposition or text address description |
| `image_url` | `VARCHAR(512)` | NULL | Secure CDN link returned from Cloudinary |
| `status` | `VARCHAR(20)` | DEFAULT `'PENDING'`, NOT NULL | `'PENDING'` or `'RESOLVED'` |

### 2.6 Table: `services_documentrequest`
Tracks official requests for documents.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | PRIMARY KEY | Unique request ID |
| `user_id`| `INTEGER` | FK (`auth_user`), ON DELETE CASCADE | Requester profile |
| `document_type`| `VARCHAR(100)`| NOT NULL | Type (e.g., `'Barangay Clearance'`) |
| `purpose` | `VARCHAR(255)` | NOT NULL | Custom purpose statement printed on clearance |
| `status` | `VARCHAR(20)` | DEFAULT `'PENDING'`, NOT NULL | `'PENDING'`, `'PROCESSING'`, `'READY_FOR_PICKUP'`, `'RELEASED'`, or `'REJECTED'` |
| `urgency_tag`| `VARCHAR(20)` | DEFAULT `'REGULAR'`, NOT NULL | `'REGULAR'` or `'URGENT'` |
| `admin_notes` | `TEXT` | NULL | Administrative remarks or pickup schedule |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT NOW(), NOT NULL | Request timestamp |

### 2.7 Table: `communications_activityschedule`
Schedules official community assemblies, medical missions, and events.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | PRIMARY KEY | Unique activity ID |
| `title` | `VARCHAR(255)` | NOT NULL | Event title |
| `description` | `TEXT` | NOT NULL | Event agenda and details |
| `event_datetime` | `TIMESTAMP WITH TIME ZONE` | NOT NULL | Scheduled date and time |
| `location` | `VARCHAR(255)` | NOT NULL | Physical venue or room |
| `created_by_id` | `INTEGER` | FK (`auth_user`), ON DELETE CASCADE | Official who scheduled the activity |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT NOW(), NOT NULL | Creation timestamp |

### 2.8 Table: `communications_emergencyhotline`
Maintains emergency contact numbers per barangay.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | PRIMARY KEY | Unique hotline ID |
| `name` | `VARCHAR(255)` | NOT NULL | Agency or station name |
| `number` | `VARCHAR(50)` | NOT NULL | Dialable phone or mobile number |
| `category` | `VARCHAR(20)` | DEFAULT `'OTHER'`, NOT NULL | `'POLICE'`, `'FIRE'`, `'MEDICAL'`, `'BARANGAY'`, or `'OTHER'` |
| `is_active` | `BOOLEAN` | DEFAULT TRUE, NOT NULL | Active listing status |
| `created_by_id` | `INTEGER` | FK (`auth_user`), ON DELETE CASCADE | Admin who added the hotline |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT NOW(), NOT NULL | Creation timestamp |
