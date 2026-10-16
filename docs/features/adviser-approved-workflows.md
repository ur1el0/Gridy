# Adviser-Approved Service Workflows

This guide summarizes manually adjudicated resident-service policies. It does not grant authority beyond the backend role and tenant checks.

## Queue fairness

Queue classification and advancement are handled by the service API. Staff cannot use resident-facing UI to change another barangay's queue. Queue clients refresh through HTTP endpoints; they should display independent errors when ticket data and live desk status fail separately.

## Assistance requests

Residents submit an assistance request for authorized staff review. Officials record decisions and required notes. KapitBayan does not autonomously determine eligibility, guarantee funding, or approve applications using AI.

## Document fees and payment

- A request is not payable while it is `PROCESSING`. Staff must first complete an explicit fee assessment or record an eligible waiver.
- Statutory exemptions and staff-approved waivers have distinct provenance; a zero amount alone does not show why no fee is due.
- Payment is available only at `READY_FOR_PICKUP` for requests with a payable fee. Residents can choose CASH or a configured manual electronic transfer recipient where supported.
- Residents report transfer details and may upload a receipt image. The uploaded proof is evidence, not confirmation that funds settled.
- Authorized same-barangay staff manually verify the transfer against the barangay's actual account. No payment gateway, webhook, bank scraping, or automatic settlement is involved.
- A positive-fee document cannot be released without the required O.R. number and the workflow's payment controls. Cash and statutory-exemption cases follow their own states.

See [ADR 007](../../architecture/decisions/007-revenue-and-official-receipt-auditing.md), [ADR 017](../../architecture/decisions/017-manual-epayment-evidence-and-verification.md), and [ADR 018](../../architecture/decisions/018-explicit-document-fee-assessment-and-waiver-provenance.md).

## Announcements and public sharing

Staff publish notices in KapitBayan. They may use the generated share kit to distribute an announcement link through an external platform. KapitBayan does not automatically post to Facebook or manage external comments. Residents use KapitBayan for follow-up requests.

## Safety reports

Incident reports are triaged by authorized staff. The feature is not a live emergency response service. For immediate danger, residents should contact emergency services or official barangay hotlines.

## Demo data

Demo-seeding commands are for explicitly confirmed local databases only and refuse unsafe environments. Review each command's `--help` and the management command code before use. Never run demo seeders against a deployed database.
