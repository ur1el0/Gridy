# ADR 011: Verified Barangay Onboarding and Tenant Payment Recipients

## Status
Accepted

## Context
Gridy must allow barangays outside the initial capstone examples to join without letting an unverified public registration create staff accounts or access another barangay's data. Barangays also use different official e-payment destinations, while the capstone does not have a payment-gateway agreement or settlement integration.

ADR 010 established manual GCash-reference verification. That decision is too narrow for barangays that accept Maya, bank transfers, or another documented e-payment method. Gridy still needs an auditable document-payment flow and must keep cash collection available.

## Decisions

1. A public applicant submits the barangay name and locality plus an authorized official's contact details. The application creates only a pending application record.
2. Only a DILG administrator can view and review applications. The reviewer must verify the applicant and official contact outside Gridy before approval. Rejections require a recorded reason.
3. Approval atomically creates the barangay tenant and its first active staff account. If the verified application matches one legacy same-name tenant with incomplete locality fields, approval completes those fields and reuses that tenant; multiple ambiguous matches block approval. The account has no usable password until the official uses Gridy's existing password-reset flow. Approval and rejection are audited.
4. Barangay identity is the case-insensitive combination of barangay name, municipality or city, and province. Existing records may keep blank locality values for compatibility; new applications require locality values. Resident and direct official registration require an approved barangay ID so the API cannot create an unassigned account.
5. Each barangay configures its own GCash, Maya, bank-transfer, or other payment recipient. Gridy stores only a display label, provider, recipient name, account or wallet identifier, and optional transfer instructions. Residents can read active recipients for their own barangay; only that barangay's administrator can configure them.
6. Residents choose a configured recipient and submit a transfer reference after a document is ready for pickup. The API validates the recipient belongs to that document's barangay and snapshots the recipient details on the request. Barangay staff manually verify/reject the reference; the Official Receipt remains the treasury record required before release. Cash remains supported and statutory exemptions remain zero-fee.
7. Gridy does not store payment passwords, PINs, one-time codes, provider API credentials, or bank login details. It does not initiate, settle, reverse, or claim to verify transfers automatically. DILG cross-barangay document views do not return tenant payment-recipient details.

## Consequences

- New barangays can join after a review gate and use the existing resident registration and password-reset flows.
- There is no automated legal-identity lookup; DILG staff remain responsible for checking submitted details.
- Payment setup is lightweight and requires no gateway, webhook, merchant account integration, or new infrastructure.
- Staff must compare transfer references with the actual receiving account and record the official receipt before release.
- Recipient edits affect future payments. Existing document requests retain the destination snapshot used when the resident submitted the reference.
