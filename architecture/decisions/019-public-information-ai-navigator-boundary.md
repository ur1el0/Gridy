# ADR 019: Public Information AI Navigator Boundary and Source Eligibility

## Status
Retired (2026-10-16)

The Navigator implementation has been removed: its API routes, web and mobile clients, provider integration, feature configuration, and announcement/activity opt-in fields are no longer part of the current system. This ADR remains as a historical record of the former design decision; it does not describe a currently available capability.

## Context
As an emerging-technology research and development component for KapitBayan (the repository retains legacy Gridy identifiers), residents frequently inquire about public barangay procedures, required documents, statutory fee exemptions (e.g., First Time Jobseekers Assistance Act - RA 11261, Certificate of Indigency - RA 7160), community schedules, public announcements, and emergency hotlines. Routine inquiries consume significant phone and counter time of barangay staff.

However, integrating Large Language Models (LLMs) into Local Government Unit (LGU) public service operations presents substantial risks:
1. **Hallucination and Misinformation:** Unconstrained generative models may invent local ordinances, fake document requirements, non-existent office hours, or incorrect clearance fees.
2. **Privacy and Sensitive Data Exposure (RA 10173):** Resident inquiries may inadvertently include personal identification numbers (PhilSys National ID, SSS, TIN), credentials, ongoing dispute/blotter narratives, or personal document tracking identifiers.
3. **Multi-Tenant Data Leakage:** In a centralized multi-barangay platform, residents of Barangay A must never receive internal or localized public advisories belonging to Barangay B.
4. **Architectural Overhead:** Consistent with ADR 009 (simplification to defended proposal architecture) and ADR 010 (approved service workflows), the system must avoid heavy distributed infrastructure such as Celery, Redis, external vector databases, or complex multi-tenant retrieval-augmented generation pipelines.

## Decision
We establish a strictly bounded, server-mediated, and tenant-isolated architecture for the Public Information AI Navigator:

1. **Resident-Only Authenticated Scope (ADR 004):**
   - The query endpoint (`POST /api/v1/public/navigator/query/` and alias `POST /api/v1/navigator/query/`) requires authentication with the `RESIDENT` role, an active resident profile, and an assigned `barangay_id`.
   - The tenant scope is strictly derived from the authenticated session (`request.user.barangay_id`). Any client-supplied tenant identifier or request override is rejected.
   - Anonymous users receive HTTP 401; non-residents, residents without profiles, and unassigned users receive HTTP 403.

2. **Approved Public Data Allowlist & Explicit Staff Opt-In:**
   - The in-process retrieval service queries only five approved source categories:
     - Same-Barangay Announcements with explicit staff opt-in (`navigator_ai_enabled=True`).
     - Upcoming/in-progress same-Barangay Activities with explicit staff opt-in (`navigator_ai_enabled=True`).
     - Active same-Barangay Emergency Hotlines (`is_active=True`).
     - Curated, reviewed server-side statutory document catalog (document requirements and statutory fee exemption references).
     - Verified Barangay Hall office contact (`Barangay.office_contact`).
   - Opt-in for announcements and activities defaults to `False`. Existing records remain disabled upon migration. Only authorized same-Barangay staff may enable AI sharing. DILG administrators cannot enable sharing across barangays.
   - Global FAQs, all private service models (`DocumentRequest`, `QueueTicket`, `AidRequest`, `IssueReport`), and resident personal identity fields are strictly excluded from queries.

3. **Deterministic Pre-Provider Privacy Guard (RA 10173):**
   - A deterministic, rule-based screening layer inspects the query before any provider invocation.
   - Any query containing government IDs (PhilSys, SSS, TIN, Passport), credentials/passwords, private request tracking identifiers, queue numbers, payment/OR references, blotter/complaint narratives, or automated decision requests is immediately intercepted.
   - On a match, the system returns a safe abstention (`status="abstained"`, `reason="privacy_guard"`) directing the resident to the authenticated portal workflow or Barangay Hall. The external provider is never invoked.

4. **Zero Transcript Persistence & Transient Processing:**
   - Single-turn stateless operation. User queries, prompt text, completions, and source bundles are never saved to the database, caches, analytics, or application logs.
   - Application error logs record only sanitized failure classifications and status codes; raw queries, prompts, and credentials are never logged.

5. **Server-Side Gemini Adapter & Strict Grounding:**
   - The external provider is Google Gemini, accessed exclusively from backend server code using the `x-goog-api-key` header. Credentials are never exposed to browser or mobile clients.
   - Gemini is constrained to structured JSON output and instructed to answer strictly using the provided source bundle, citing source references by ID.
   - The backend validates every returned cited source against the exact source bundle for that turn. If citations are missing, invalid, or cite unknown sources, the backend coerces the response to a safe abstention (`status="abstained"`, `reason="invalid_citations"`).
   - The system never infers or estimates ordinary clearance fees or office hours; unsupported fee inquiries abstain and escalate to the Barangay Hall.

6. **Degraded and Unavailable Fallback:**
   - If the feature is disabled (`PUBLIC_NAVIGATOR_ENABLED=False`), credentials are unconfigured, or the provider times out, hits rate limits, or fails, the endpoint returns a schema-valid fallback (`status="unavailable"`) presenting available verified contacts and hotlines. No 500 error or uncaught exception reaches the client.

7. **Production Gate:**
   - The feature is disabled by default. Production enablement remains gated on institutional privacy review and verification of external provider data-retention/training terms.

## Consequences
* **Positive:** Guaranteed multi-tenant data isolation; zero risk of PII leakage from private service records; verifiable citation grounding; immediate pre-provider privacy rejection; zero transcript persistence under RA 10173; adherence to ADR 009 without Celery/Redis/vector database dependencies.
* **Positive:** Robust graceful degradation ensuring residents receive active emergency hotlines and office contacts even when the AI service is disabled or offline.
* **Negative:** Announcements and activities require manual staff review and opt-in before becoming available to the navigator.
* **Negative:** Strict abstention boundaries prevent the model from answering queries outside the approved source bundle (e.g., ordinary local clearance fees without an explicit catalog).
