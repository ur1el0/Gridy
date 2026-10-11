# 10 Testing Protocols & Quality Assurance

## 1. QA Methodology: Automated & Black-Box Testing
The system is subjected to strict functional validation via automated unit/integration testing (using Django's `APITestCase`) and functional Black-Box Testing.

### 1.1 Automated Test Suite
We have built an automated test suite containing 11 tests that cover core authentication and barangay service lifecycles.

| Test ID | App Area | Test Scenario | Verified Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Auth | User Registration Success | Creating user account also initializes their `Resident` profile table with name and birth date. | **[Passed]** |
| **TC-AUTH-02** | Auth | Password Strength validation | Ensuring weak passwords (e.g., "123") fail validation and return 400 Bad Request. | **[Passed]** |
| **TC-AUTH-03** | Auth | JWT Login Success | Valid credentials return JWT access and refresh tokens. | **[Passed]** |
| **TC-AUTH-04** | Auth | Profile Route Auth Required | Hitting `/api/v1/auth/me/` without a bearer token returns 401 Unauthorized. | **[Passed]** |
| **TC-AUTH-05** | Auth | Profile Detail Retrieval | Hitting `/api/v1/auth/me/` with a valid JWT token returns username and profile profile info. | **[Passed]** |
| **TC-SERV-01** | Services | Document Request Creation | Authenticated residents can successfully create document requests. | **[Passed]** |
| **TC-SERV-02** | Services | Document Validation Blocked | Standard residents trying to PATCH the `/validate/` endpoint get 403 Forbidden. | **[Passed]** |
| **TC-SERV-03** | Services | Document Validation Success | Barangay Officials can PATCH the `/validate/` endpoint to Approve/Reject requests. | **[Passed]** |
| **TC-SERV-04** | Services | Queue Ticket Generation | Residents can generate tickets, with the database auto-sequencing ticket numbers (e.g. `T001`). | **[Passed]** |
| **TC-SERV-05** | Services | Queue Ticket Advance Blocked | Residents trying to POST to `/next/` get 403 Forbidden. | **[Passed]** |
| **TC-SERV-06** | Services | Queue Ticket Advance Success | Barangay Officials can POST to `/next/` to advance the active ticket from WAITING to SERVING. | **[Passed]** |

---

## 2. ISO/IEC 25010 Quality Evaluation
The KapitBayan system is evaluated under four specific quality characteristics of the ISO/IEC 25010 model:

### 2.1 Functional Suitability
Evaluates whether the software functions meet stated goals.
*   **Implementation:** Developed cohesive models and endpoints for Announcements, Queue Management, Issue Reporting (integrated with Cloudinary), and Document Requests.
*   **Verification:** Verified via Django check routines and automated API testing. All core endpoints process requests without runtime exceptions.

### 2.2 Security
Evaluates the system's capacity to protect data and enforce access permissions.
*   **Implementation:** Implemented JWT-based authentication using `django-rest-framework-simplejwt` and designed custom Django permission classes (`IsBarangayOfficial`, `IsResident`).
*   **Verification:** Covered by test cases TC-SERV-02 and TC-SERV-05, ensuring non-admin users cannot validate requests or alter queue states.

### 2.3 Reliability (Fault Tolerance)
Evaluates the system's ability to maintain performance levels and handle external service failures gracefully.
*   **Implementation:** Implemented defensive helper checks for Firebase Admin SDK. If credentials or keys are missing locally, the system logs warnings instead of crashing the server, allowing offline execution and testing.
*   **Verification:** Confirmed by running tests; tests successfully bypassed external Firebase connectivity while outputting warning alerts.

### 2.4 Maintainability (Modularity & Testability)
Evaluates how easily the codebase can be modified, audited, and tested.
*   **Implementation:** Divided features into separate decoupled Django apps (`gridy_auth`, `gridy_services`, `gridy_reports`, `gridy_communications`). 
*   **Verification:** All services use clean RESTful viewsets and serializers. Testability is secured with an 11-case test runner covering critical business operations.

---

## 3. Manual Testing Validation Steps
*   **Validation of Document State Transition:** Admin processes request status updates on React $\rightarrow$ State switches from `PENDING` to `APPROVED` or `REJECTED` $\rightarrow$ Webhook/notification service triggers FCM callback $\rightarrow$ Resident app screen updates automatically without manual app refresh.
