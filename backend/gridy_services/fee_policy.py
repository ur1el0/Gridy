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

    The benefit is limited to linked resident accounts requesting Barangay Clearance.
    The same resident may receive it once; unrelated statutory exemptions do not consume
    this RA 11261 benefit.
    """
    from gridy_auth.models import User

    if user is None or getattr(user, "role", None) != User.Role.RESIDENT:
        return False, "RA 11261 eligibility requires a linked resident account."

    normalized_document_type = " ".join((document_type or "").split()).casefold()
    if normalized_document_type != "barangay clearance":
        return False, "RA 11261 first-time jobseeker exemption applies only to Barangay Clearance."

    from .models import DocumentRequest

    prior_statutory = DocumentRequest.objects.filter(
        user=user,
        document_type__iexact="Barangay Clearance",
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
