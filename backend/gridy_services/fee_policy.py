from decimal import Decimal

FEE_EXEMPT_DOCUMENT_TYPES = frozenset({
    "certificate of indigency",
    "first time job seeker certificate",

})

def enforce_fee_policy(document_type, validated_data):
    normalized_type = " ".join((document_type or "").split()).casefold()

    if normalized_type in FEE_EXEMPT_DOCUMENT_TYPES:
        validated_data["fee_amount"] = Decimal("0.00")

    return validated_data