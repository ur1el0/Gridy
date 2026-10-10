# ADR 012: Legacy RBI Census Import Audit Provenance

## Status
Accepted

## Context
Self-service resident registration mandates at least one digital proof-of-identity upload (`philsys_id_photo`, `secondary_id_photo`, or `utility_billing_photo`). However, barangay administrations maintain historical Registry of Barangay Inhabitants (RBI) census records that must be ingested in bulk without resident-uploaded digital images. Ingested residents are treated as administratively pre-verified (`is_verified=True`) without fabricating placeholder image files or provisioning insecure default credentials.

To establish administrative and legal accountability under Philippine privacy standards (RA 10173) and local governance guidelines, the system must maintain durable provenance linking:
1. The importing administrative official (`action_by`),
2. The specific tenant barangay context (`user.barangay`),
3. The ingested CSV file name and unique batch identifier, and
4. The individual provisioned resident accounts (`Resident.id`, `User.username`).

We evaluated two architectural approaches:
- **Approach A (Relational Schema Extension)**: Add a dedicated database model (`ResidentImportBatch`) and foreign key columns on `Resident` (e.g., `import_batch_id`, `imported_by_id`, `import_source`).
- **Approach B (AuditLog Provenance Linkage)**: Leverage the existing immutable `gridy_audit.models.AuditLog` infrastructure via `log_action` under `action_type=AuditLog.ActionType.USER_ACTION`.

## Decision
We chose **Approach B**: recording legacy RBI census import provenance using the existing `AuditLog` service without introducing schema changes or database migrations.

1. **Dual-Tier Audit Logging**:
   - **Batch-Level Record**: Emits an audit entry recording the importing official, batch ID, CSV filename, target barangay name, resident count, and a comma-separated list of all provisioned `Resident.id`s.
   - **Resident-Level Records**: Emits an individual audit entry for each imported account containing the resident's full name, profile ID, username, CSV filename, and batch ID.
2. **Tenant Scoping Guard**: Requires the importing administrator to possess an assigned barangay (`user.barangay_id is not None`). Unassigned administrators are rejected with HTTP 403 Forbidden before CSV processing begins, preventing orphan resident records or unassigned audit trails.
3. **Zero Migration Footprint**: Eliminates schema migration risks against production databases (Neon PostgreSQL) for what is primarily an administrative onboarding operation.

## Consequences & Rationale

### Rationale
- **Uniform Administrative Pattern**: Matches the existing provenance and attestation architecture used in `VerifyResidentView` and `RejectResidentView`, which record official administrative decisions directly in `AuditLog`.
- **Audit Immutability**: `AuditLog` records include authenticated actor, timestamp, client IP, user agent, and action classification, providing reliable evidentiary trails.
- **Minimalist Data Model**: Adheres to deliberate minimalism and avoids adding rarely modified relational columns to the high-traffic `Resident` and `User` tables.

### Limits
- **Relational Queryability**: Provenance is captured in structured textual descriptions rather than indexed relational foreign keys. Filter queries linking a resident to their import batch require text search or audit log correlation rather than SQL joins.
- **Batch Reversal / Rollback**: The system does not support automated batch rollbacks. If administrative batch-level cancellation or frequent historical reprocessing becomes a requirement, a formal relational `ResidentImportBatch` entity may be introduced in a future milestone.
