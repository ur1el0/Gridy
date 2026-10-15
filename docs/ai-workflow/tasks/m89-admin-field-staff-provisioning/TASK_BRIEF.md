# M89: Barangay Admin Field Staff Provisioning

## 1. Metadata
- Task ID: m89-admin-field-staff-provisioning
- Task Type: Feature
- Target components: Django auth API, React admin web
- Branch: feat/admin-field-staff-provisioning
- Base: origin/main at d09a26342c2f47b7ca6c7d9bb9a45e4427366d7f
- Implementer/reviewer: Codex / read-only self-review

## 2. Objective and Scope
Let an authenticated Barangay Admin create and manage Field Official accounts from Barangay Settings. The server assigns FIELD_OFFICIAL and the admin's own barangay; the new staff member sets their own password through the existing email password setup flow.

Non-goals: public staff registration; DILG creation of field staff; user-selected roles or barangays; Flutter feature changes; a cryptographic guarantee that a bearer token can only be used by a native app; new identity providers, device attestation, schema changes, Celery, or Redis.

## 3. Current Behavior and Evidence
On the current origin/main baseline, User.Role.FIELD_OFFICIAL exists (backend/gridy_auth/models.py:100-111) and Flutter routes that role to FieldOfficialScreen (mobile/lib/main.dart:23-35). The web app's administrative routes allow ADMIN and DILG_ADMIN, while the resident portal allows only RESIDENT (frontend/src/App.tsx:117-151). The admin registration serializer and barangay approval flow create ADMIN, not FIELD_OFFICIAL (backend/gridy_auth/serializers/registration.py:159-245, backend/gridy_auth/views/onboarding.py:147-157). The baseline has no /auth/staff/ endpoint or field staff management panel.

A separate, unmerged local/remote branch feat/admin-staff-management contains an earlier implementation of the staff panel and API. It is reference material only: it asks the administrator to choose the staff member's password, so this milestone will use a password setup link instead.

## 4. Required Rules and Security
- Only authenticated ADMIN users assigned to a barangay may list, create, activate, or deactivate that barangay's Field Officials.
- DILG_ADMIN, FIELD_OFFICIAL, RESIDENT, anonymous users, and unassigned admins cannot create or manage field staff.
- Derive barangay_id and role exclusively from the authenticated administrator. Reject client attempts to submit role, barangay, barangay_id, is_staff, is_superuser, or a password.
- Create accounts with an unusable password; send a one-time password setup link using the existing reset-token path after the database transaction commits. Do not return or log tokens.
- Deactivation revokes active refresh sessions and records an audit event. Keep all lookups tenant-scoped so cross-barangay IDs are concealed as 404.
- Field Officials use the dedicated mobile operations screen; web route guards continue to deny them administrative and resident pages. This is a product-interface boundary, not cryptographic device binding: do not claim that API bearer tokens are technically unusable outside the mobile app.
- No database migration, production data action, new dependency, payment change, or task-queue infrastructure.

## 5. Observable Acceptance Criteria
1. An assigned Barangay Admin can create a Field Official from the admin web.
2. The server fixes the new account role to FIELD_OFFICIAL, tenant to the administrator's barangay, is_staff=False, and password to unusable until setup.
3. A successful creation sends a password setup email after commit using an expiring, single-use Django reset token; response and logs contain no token or password.
4. Arbitrary role/tenant/privilege/password fields in the request are rejected. Duplicate username/email and invalid identity fields produce safe validation errors.
5. Only assigned same-barangay admins can list or change status; other roles are denied, and cross-barangay staff IDs return 404.
6. Deactivation revokes refresh sessions and audit logs creation/status changes; activation does not change role or barangay.
7. The admin web has an accessible staff form/list/status control under Barangay Settings, with loading, retry, validation, and success/error states and no password input.
8. The Field Official role continues to open the Flutter FieldOfficialScreen; browser login is denied for that role, any newly issued browser refresh cookie is cleared, and direct web route entry lands on a clear mobile-app notice rather than a redirect loop. No Field Official admin web route is added.
9. No schema migration or new dependencies are introduced; targeted backend and frontend checks pass.

## 6. Relevant Areas
- Backend: backend/gridy_auth/views/, serializers/, urls.py, tasks.py, tests/, backend/config/settings.py
- Web: frontend/src/pages/admin/BarangaySettings.tsx, StaffManagementSettings.tsx (new), corresponding tests
- Existing contracts: backend/gridy_auth/views/password_reset.py, backend/gridy_auth/serializers/auth.py
- Reference only: branch feat/admin-staff-management

## 7. Risks and Mitigations
- Password setup email may fail asynchronously: keep the account password unusable and let staff request the standard password reset email; surface a clear admin message that setup instructions were sent and include recovery guidance.
- Tenant or role escalation: derive both server-side, reject extra fields, and cover cross-role/cross-barangay requests in API tests.
- Mobile-only can be overstated: keep web routes role-guarded and describe mobile as the supported Field Official interface; do not use User-Agent checks as a security control.
