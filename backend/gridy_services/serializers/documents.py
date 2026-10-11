from rest_framework import serializers
from gridy_auth.models import User
from ..fee_policy import enforce_fee_policy
from ..models import DocumentRequest


class FeePolicyValidationMixin:
    def validate(self, attrs):
        attrs = super().validate(attrs)
        document_type = attrs.get("document_type")

        if document_type is None and self.instance is not None:
            document_type = self.instance.document_type

        return enforce_fee_policy(document_type, attrs)


class DocumentRequestSerializer(FeePolicyValidationMixin, serializers.ModelSerializer):
    request_id = serializers.IntegerField(source='id', read_only=True)
    requester_name = serializers.SerializerMethodField()
    purok = serializers.SerializerMethodField()
    payment_recipient = serializers.SerializerMethodField()
    payment_recipient_name_snapshot = serializers.SerializerMethodField()
    payment_recipient_identifier_snapshot = serializers.SerializerMethodField()
    payment_instructions_snapshot = serializers.SerializerMethodField()

    class Meta:
        model = DocumentRequest
        fields = [
            'id',
            'request_id',
            'requester_name',
            'purok',
            'is_walkin',
            'walkin_name',
            'walkin_purok',
            'document_type',
            'purpose',
            'urgency_tag',
            'status',
            'admin_notes',
            'or_number',
            'fee_amount',
            'payment_method',
            'payment_recipient',
            'payment_recipient_name_snapshot',
            'payment_recipient_identifier_snapshot',
            'payment_instructions_snapshot',
            'payment_reference',
            'payment_status',
            'payment_review_note',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'is_walkin',
            'status',
            'admin_notes',
            'or_number',
            'fee_amount',
            'payment_method',
            'payment_recipient',
            'payment_recipient_name_snapshot',
            'payment_recipient_identifier_snapshot',
            'payment_instructions_snapshot',
            'payment_reference',
            'payment_status',
            'payment_review_note',
            'created_at',
            'updated_at',
        ]

    def get_requester_name(self, obj) -> str:
        if obj.user:
            return getattr(obj.user.profile, 'full_name', obj.user.username) if hasattr(obj.user,'profile') else obj.user.username
        return obj.walkin_name if obj.walkin_name else "Walk-in Resident"

    def get_purok(self, obj) -> str:
        if obj.user and hasattr(obj.user, 'profile') and obj.user.profile.purok:
            return str(obj.user.profile.purok)
        return str(obj.walkin_purok) if obj.walkin_purok else "N/A"

    def _can_view_payment_recipient_snapshot(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        return bool(
            user
            and user.is_authenticated
            and user.role != User.Role.DILG_ADMIN
            and user.barangay_id == obj.barangay_id
        )

    def get_payment_recipient(self, obj) -> int | None:
        return obj.payment_recipient_id if self._can_view_payment_recipient_snapshot(obj) else None

    def get_payment_recipient_name_snapshot(self, obj) -> str | None:
        return obj.payment_recipient_name_snapshot if self._can_view_payment_recipient_snapshot(obj) else None

    def get_payment_recipient_identifier_snapshot(self, obj) -> str | None:
        return obj.payment_recipient_identifier_snapshot if self._can_view_payment_recipient_snapshot(obj) else None

    def get_payment_instructions_snapshot(self, obj) -> str | None:
        return obj.payment_instructions_snapshot if self._can_view_payment_recipient_snapshot(obj) else None


class DocumentRequestReviewSerializer(FeePolicyValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = DocumentRequest
        fields = [
            "status",
            "admin_notes",
            "or_number",
            "fee_amount",
            "payment_method",
        ]

    def validate_status(self, value):
        allowed_statuses = {
            DocumentRequest.Status.PROCESSING,
            DocumentRequest.Status.READY_FOR_PICKUP,
            DocumentRequest.Status.RELEASED,
            DocumentRequest.Status.REJECTED,
        }
        if value not in allowed_statuses:
            raise serializers.ValidationError("Invalid status transition")

        return value
