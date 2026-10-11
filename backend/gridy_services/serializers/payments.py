from rest_framework import serializers
from ..models import DocumentRequest


class PaymentReferenceSerializer(serializers.Serializer):
    payment_recipient_id = serializers.IntegerField(min_value=1)
    payment_reference = serializers.CharField(
        max_length=100,
        allow_blank=False,
        trim_whitespace=True,
    )


class PaymentReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=(
            DocumentRequest.PaymentStatus.VERIFIED,
            DocumentRequest.PaymentStatus.REJECTED,
        )
    )
    note = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    def validate(self, attrs):
        if (
            attrs["status"] == DocumentRequest.PaymentStatus.REJECTED
            and not attrs.get("note", "").strip()
        ):
            raise serializers.ValidationError({
                "note": "A reason is required when rejecting a transfer."
            })
        return attrs
