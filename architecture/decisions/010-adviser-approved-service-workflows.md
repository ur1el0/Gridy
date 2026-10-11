# ADR 010: Adviser-Approved Resident Service Workflows

## Status
Accepted for the capstone implementation; payment-provider details are superseded in part by ADR 011.

## Context

The adviser requested a bounded queue policy that protects regular residents while preserving priority service, resident-submitted requests for assistance, shareable public notices, an after-hours path for safety reports, GCash payments alongside cash, and useful presentation analytics. KapitBayan also serves multiple barangays, so these workflows must preserve tenant isolation and avoid invented automated decisions or money movement.

## Decisions

1. **Queue service uses a two-priority-to-one-regular rotation.** When both lanes have waiting tickets, `Next Ticket` serves no more than two priority tickets before one regular ticket. If one lane is empty, the waiting lane proceeds. The daily rotation counter uses Manila time and resets at midnight. Staff changes to priority classification remain auditable.
2. **Assistance requests are reviewed manually.** Residents provide an assistance type and reason. Barangay officials record a decision and must provide a reason when declining. KapitBayan does not decide eligibility or promise funds.
3. **GCash references require manual verification.** Residents submit a transfer reference after a document is ready for pickup. Staff check the transfer using the barangay's actual GCash account, record the official receipt, and then release the document. A reference alone is not proof of payment. Cash collection remains supported; statutory fee exemptions remain zero.
4. **Announcements have a read-only public view.** Officials may share a barangay-specific KapitBayan announcement page through social platforms. Requests and transactions remain in KapitBayan. The KapitBayan page has no comment or transaction interface; KapitBayan cannot manage replies on external social platforms, so officials use those platforms' own controls where available.
5. **After-hours safety reports use incident triage.** When live chat is unavailable, residents submit an incident report for field staff to review. Immediate emergencies still go to the appropriate emergency service or barangay hotline.
6. **Analytics fixtures are synthetic and local-only.** Seed commands require explicit confirmation, `DEBUG=True`, and a local database host. Production builds only apply migrations and do not create presentation accounts or records. Legacy seeded demo credentials are disabled by a narrowly matched one-time migration.

## Consequences

- Residents can complete the principal workflows from web and mobile without adding a payment gateway, automated aid eligibility rules, or a new after-hours chat service.
- Staff retain the final decision on assistance eligibility and payment settlement, with audit records for sensitive review actions.
- The original GCash-only recipient workflow was later expanded by ADR 011 to tenant-configured manual transfer recipients. KapitBayan still does not process transfers.
- Public social posts may have their own comment controls. Those controls belong to each external platform and are not enforced by KapitBayan.
- Demonstration charts can use repeatable records without exposing seeded credentials or writing demo records to Neon or another remote database.
