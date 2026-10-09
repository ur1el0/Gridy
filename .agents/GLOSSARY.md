# Gridy - Domain & Legal Glossary

This document defines core legal statutes, administrative Philippine local government terminology, and technical domain concepts governing the Gridy system.

---

## 1. Legal & Regulatory Baselines

### Republic Act No. 7160 (Local Government Code of 1991)
The primary Philippine statutory framework devolving national powers to local government units (LGUs). Section 384 defines the **Barangay** as the basic political unit serving as the primary planning and implementing unit of government policies, plans, programs, projects, and activities in the community.

### Republic Act No. 10173 (Data Privacy Act of 2012)
Governs the processing of all personal data in the Philippines, enforced by the National Privacy Commission (NPC). In Gridy:
* **PII Protection:** Resident records (birthdates, exact purok domiciles, civil statuses, contact info) are classified as protected personal/sensitive information.
* **Access Control:** Gated behind strict authentication walls, role-based access control (RBAC), and automated multi-tenant query boundaries.
* **Audit Trails:** Administrative modifications, exports, and document releases generate immutable audit logs (`gridy_audit`).

### Commission on Audit (COA) Circulars & Treasury Compliance
Rules governing revenue collection, financial reporting, and accountable forms in Philippine local governments:
* **Official Receipt (O.R.) Number:** Unique accounting serial code issued upon payment of barangay administrative and clearance assessment fees.
* **Revenue Auditing:** Every issued document clearance records the `fee_amount` in Philippine Pesos (PHP) and associated `or_number` for municipal treasury reconciliation.

---

## 2. Barangay Governance & Organizational Hierarchy

### Barangay
The smallest administrative and political subdivision in the Philippines, headed by a Punong Barangay (Barangay Captain) and Sangguniang Barangay (Barangay Council).

### Purok / Sitio
Sub-village geographic clusters and neighborhood zones within a barangay (e.g., "Purok Maligaya", "Sitio Ilaya"). Modeled as alphanumeric string fields (`CharField`) to support descriptive local naming conventions.

### Registry of Barangay Inhabitants (RBI)
Official LGU population census documenting resident profiles, household heads, residency tenures, and socio-economic demographics. Gridy supports bulk RBI CSV migration and automated account linking.

### Barangay Tanod / Field Officials
Community watchmen and peace officers appointed by the Punong Barangay. In Gridy, modeled under the `FIELD_OFFICIAL` RBAC tier, equipped with roving tools: physical queue advancement, clearance authenticity verification, and on-the-ground incident inspection.

### Lupon Tagapamayapa (Katarungang Pambarangay)
Community-based conciliation panel established under Presidential Decree No. 1508 / RA 7160 for non-adversarial resolution of localized disputes before court litigation.

---

## 3. Clearances & Document Services

### Barangay Clearance
Official certification certifying that an applicant is a resident of good moral standing and has no pending derogatory criminal or civil cases recorded in the barangay blotter. Common requirement for job employment, postal IDs, and business licenses.

### Certificate of Residency
Official document certifying that the applicant is a bona fide resident residing within a specific purok or street address of the barangay.

### Certificate of Indigency
Official certification stating that the resident belongs to an indigent or low-income household, typically presented to access national medical subsidies (DSWD/PhilHealth), educational scholarships, or legal aid (PAO).

### Business Clearance (Barangay Business Permit)
Endorsement issued to local micro-enterprises and commercial establishments operating within the barangay jurisdiction, verifying zoning and local regulation compliance.

### Hybrid Walk-In Issuance
Direct desk capability allowing barangay officials to process, assess fees, record O.R. numbers, and release stamped PDF clearances for walk-in residents without requiring an active smartphone app account.

---

## 4. Operational Concepts & Terminology

### Multi-Tenancy (Barangay Isolation)
Architectural guarantee ensuring data belonging to Barangay A (residents, clearances, queue tickets, reports) is strictly invisible and inaccessible to users and officials belonging to Barangay B.

### Live Queue Ticker
Hybrid physical-digital lobby system coordinating paper ticket slips with real-time mobile push and desktop web displays to prevent hall congestion.

### Priority Queue Rotation
The `Next Ticket` policy that serves up to two waiting priority tickets for each regular ticket while both groups are waiting. If one group is empty, staff serve the other group. The quota restarts at Manila midnight.

### Assistance Request
A resident-submitted request for barangay aid or allowance. Barangay officials review and record the decision; Gridy does not automate eligibility or promise funds.

### Payment Recipient
A payment destination configured by one barangay, such as its GCash wallet, Maya wallet, bank account, or another approved e-payment account. Gridy stores the recipient name, account identifier, and transfer instructions so residents in that barangay can make a transfer. It never stores wallet or bank passwords, PINs, or one-time codes.

### Payment Verification
The manual check by barangay staff that an electronic transfer reference matches money received by that barangay. A reference entered by a resident alone does not authorize document release; staff must verify the payment and record the official receipt. Cash collection remains available.

### Barangay Onboarding Application
A public request to add a barangay to Gridy. The application does not create a tenant or account until a DILG administrator completes independent verification and approves it.

### Public Announcement Page
A read-only, publicly accessible Gridy page that displays a barangay's announcements. Requests and other transactions remain inside the authenticated Gridy portal. Gridy does not control replies on external social platforms.

### After-Hours Incident Report
A resident-submitted safety report that field officials triage through the existing incident-report workflow when live chat is unavailable. Immediate danger requires contacting the appropriate emergency service or barangay hotline.

### Presentation Data
Clearly labeled synthetic records used for local demonstrations and analytics. Demo seed commands are restricted to an explicitly confirmed local database and are never part of production startup.

### Incident Triage
Four-tier categorization (`MINOR`, `MODERATE`, `HAZARD`, `EMERGENCY`) determining priority response workflows and Tanod field dispatches for reported community hazards.
