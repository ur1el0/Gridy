from rest_framework import serializers
from gridy_auth.models import User
from .models import AidRequest, DocumentRequest, QueueTicket
from .fee_policy import enforce_fee_policy

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

class PaymentReferenceSerializer(serializers.Serializer):
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


class AidRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.SerializerMethodField()

    class Meta:
        model = AidRequest
        fields = [
            "id",
            "requester_name",
            "assistance_type",
            "reason",
            "status",
            "staff_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "status",
            "staff_notes",
            "created_at",
            "updated_at",
        ]

    def get_requester_name(self, obj) -> str:
        profile = getattr(obj.requester, "profile", None)
        return (
            profile.full_name
            if profile and profile.full_name
            else obj.requester.username
        )


class AidRequestReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = AidRequest
        fields = ["status", "staff_notes"]

    def validate_status(self, value):
        if value not in {
            AidRequest.Status.UNDER_REVIEW,
            AidRequest.Status.APPROVED,
            AidRequest.Status.DECLINED,
        }:
            raise serializers.ValidationError("Select a valid review status.")
        return value

    def validate(self, attrs):
        status_value = attrs.get(
            "status",
            getattr(self.instance, "status", None),
        )
        notes = attrs.get(
            "staff_notes",
            getattr(self.instance, "staff_notes", ""),
        )
        if status_value == AidRequest.Status.DECLINED and not notes.strip():
            raise serializers.ValidationError({
                "staff_notes": (
                    "A reason is required when declining an assistance request."
                )
            })
        return attrs


class QueueTicketSerializer(serializers.ModelSerializer):
    ticket_id = serializers.IntegerField(source='id', read_only=True)
    resident_name = serializers.SerializerMethodField()
    priority_reason = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=False,
        max_length=500,
    )

    class Meta:
        model = QueueTicket
        fields = [
            'ticket_id',
            'ticket_number',
            'resident_name',
            'walkin_name',
            'service_type',
            'priority_status',
            'is_priority',
            'priority_reason',
            'notes',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['status', 'ticket_number', 'created_at', 'updated_at']

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get('request')
        action = getattr(self.context.get('view'), 'action', None)
        submitted = getattr(self, 'initial_data', {})
        priority_fields = {'priority_status', 'is_priority', 'priority_reason'}

        if self.instance is not None and priority_fields.intersection(submitted):
            raise serializers.ValidationError({
                'priority_status': (
                    'Use the dedicated priority endpoint to change a ticket priority.'
                )
            })

        if self.instance is None and action == 'create':
            status_supplied = 'priority_status' in submitted
            flag_supplied = 'is_priority' in submitted
            requested_status = attrs.get('priority_status')
            requested_flag = attrs.get('is_priority')

            if not status_supplied and not flag_supplied:
                requested_status = QueueTicket.Priority.REGULAR
                requested_flag = False
            elif status_supplied and not flag_supplied:
                requested_flag = (
                    requested_status == QueueTicket.Priority.PRIORITY
                )
            elif flag_supplied and not status_supplied:
                requested_status = (
                    QueueTicket.Priority.PRIORITY
                    if requested_flag
                    else QueueTicket.Priority.REGULAR
                )

            if requested_flag != (
                requested_status == QueueTicket.Priority.PRIORITY
            ):
                raise serializers.ValidationError({
                    'priority_status': 'Priority fields must describe the same state.'
                })

            is_priority = requested_status == QueueTicket.Priority.PRIORITY
            user = getattr(request, 'user', None)

            if user and user.role == User.Role.RESIDENT and is_priority:
                raise serializers.ValidationError({
                    'is_priority': (
                        'Priority lane access must be verified by barangay staff.'
                    )
                })

            if is_priority:
                if not user or user.role != User.Role.ADMIN:
                    raise serializers.ValidationError({
                        'is_priority': 'Only a barangay admin can assign priority.'
                    })
                if not attrs.get('priority_reason'):
                    raise serializers.ValidationError({
                        'priority_reason': (
                            'A reason is required when assigning a priority ticket.'
                        )
                    })
            elif attrs.get('priority_reason'):
                raise serializers.ValidationError({
                    'priority_reason': (
                        'A reason is only accepted when assigning priority.'
                    )
                })

            attrs['priority_status'] = requested_status
            attrs['is_priority'] = requested_flag

        return attrs

    def create(self, validated_data):
        validated_data.pop('priority_reason', None)
        return super().create(validated_data)

    def get_resident_name(self, obj) -> str:
        if obj.user:
            return getattr(obj.user.profile, 'full_name', obj.user.username) if hasattr(obj.user, 'profile') else obj.user.username
        return obj.walkin_name if obj.walkin_name else "Walk-in Resident"


class QueueTicketPrioritySerializer(serializers.Serializer):
    priority_status = serializers.ChoiceField(choices=QueueTicket.Priority.choices)
    reason = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=500,
    )

class PublicQueueStatusSerializer(serializers.Serializer):
    barangay_name = serializers.CharField(read_only=True)
    primary_color = serializers.RegexField(
        regex=r"^#[0-9A-Fa-f]{6}$",
        read_only=True,
    )
    current_ticket = serializers.CharField(
        allow_null=True,
        read_only=True,
    )
    total_waiting = serializers.IntegerField(
        min_value=0,
        read_only=True,
    )
        

class DocumentStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    released = serializers.IntegerField()
    total_revenue = serializers.FloatField(required=False, default=0.0)

class UrgencyBreakdownSerializer(serializers.Serializer):
    low = serializers.IntegerField()
    medium = serializers.IntegerField()
    high = serializers.IntegerField()
    urgent = serializers.IntegerField()

class IssueStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    resolved = serializers.IntegerField()
    urgency_breakdown = UrgencyBreakdownSerializer()

class QueueActivitySerializer(serializers.Serializer):
    total_today = serializers.IntegerField()
    serving_now = serializers.CharField(allow_null=True)
    waiting_count = serializers.IntegerField()

class DashboardSummarySerializer(serializers.Serializer):
    total_residents = serializers.IntegerField(default=0)
    document_requests = DocumentStatsSerializer()
    issue_reports = IssueStatsSerializer()
    queue_activity = QueueActivitySerializer()
