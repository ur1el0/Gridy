from decimal import Decimal

# Canonical statutory document types that are inherently free by administrative mandate
STATUTORY_INDIGENCY_DOCUMENT_TYPES = frozenset({
    "certificate of indigency",
})

# Backward-compatible alias
FEE_EXEMPT_DOCUMENT_TYPES = STATUTORY_INDIGENCY_DOCUMENT_TYPES


def check_ra11261_eligibility(user, document_type, current_request_id=None):
    """
    Verifies eligibility for Republic Act No. 11261 (First Time Jobseekers Assistance Act).

    Requirements:
    1. Beneficiary must be a resident (or walk-in with verified identity).
    2. One-Time Availment Restriction (RA 11261 Sec. 5): The exemption may only be availed once.
       If the resident has already received a non-rejected statutory exemption for a document request,
       they are ineligible for further statutory exemptions.
    """
    if not user:
        return True, None

    from .models import DocumentRequest

    prior_statutory = DocumentRequest.objects.filter(
        user=user,
        fee_assessment_status=DocumentRequest.FeeAssessmentStatus.STATUTORY_EXEMPT,
    ).exclude(status=DocumentRequest.Status.REJECTED)

    if current_request_id:
        prior_statutory = prior_statutory.exclude(pk=current_request_id)

    if prior_statutory.exists():
        first_doc = prior_statutory.first()
        return False, (
            f"Resident has already availed of the one-time RA 11261 statutory fee exemption "
            f"(Request #{first_doc.id} - {first_doc.document_type})."
        )

    return True, None


def enforce_fee_policy(document_type, validated_data):
    normalized_type = " ".join((document_type or "").split()).casefold()

    if normalized_type in STATUTORY_INDIGENCY_DOCUMENT_TYPES:
        validated_data["fee_amount"] = Decimal("0.00")

    return validated_data