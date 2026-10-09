from rest_framework import serializers

from gridy_services.models import PaymentRecipient


class PaymentRecipientSerializer(serializers.ModelSerializer):
    provider_label = serializers.CharField(source="get_provider_display", read_only=True)

    class Meta:
        model = PaymentRecipient
        fields = [
            "id",
            "provider",
            "provider_label",
            "display_name",
            "recipient_name",
            "recipient_identifier",
            "instructions",
            "is_active",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]

    def validate(self, attrs):
        for field in (
            "display_name",
            "recipient_name",
            "recipient_identifier",
            "instructions",
        ):
            if field in attrs and isinstance(attrs[field], str):
                attrs[field] = attrs[field].strip()
        return attrs
