# Bulk RBI Census CSV Import

The import workflow helps an authorized barangay administrator migrate legacy Registry of Barangay Inhabitants records that may not have digitized proof images. It is an administrative attestation and audit trail, not a self-service registration shortcut.

## Authorization and tenant scope

The endpoint is `POST /api/v1/auth/import-residents/`. It requires an authenticated `ADMIN` assigned to a barangay. The importing official's barangay determines the destination; the request cannot select another tenant. An unassigned administrator is rejected before CSV processing.

## Legacy evidence and credentials

Legacy rows may be imported without identity or proof-of-residency images. The importer does not fabricate files, storage URLs, or proof values. Created accounts receive unusable credentials (`password=None`) and must complete the approved account-claim or password-setting process before sign-in. Existing resident profile rows and evidence fields are preserved on idempotent reruns.

## Provenance

The importer writes batch-level and resident-level `AuditLog` records, including the importing actor, barangay identity, source context, and a shared UUID batch correlation value. These are durable application records, not a cryptographic immutable log or DB-enforced unique event stream. See [ADR 012](../../architecture/decisions/012-legacy-rbi-import-audit-provenance.md).

## CSV handling

Use the template and validation displayed by the current Residents interface. The required headers and accepted formats are defined by the import serializer/view and its tests; check those sources before preparing a production import. Resolve duplicates and validation errors from the returned report, and review a small sample before importing a full census.

## Operational safeguards

- Export and review the source CSV before upload; only transfer records through an authenticated staff account.
- Confirm the active account's barangay and the source file's intended tenant.
- Test on a disposable local database first. Never use demo seeding commands on production data.
- Preserve the original source and import audit records according to the LGU's approved retention policy.
