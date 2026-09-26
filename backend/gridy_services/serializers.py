from rest_framework import serializers
from .models import DocumentRequest, QueueTicket

class DocumentRequestSerializer(serializers.ModelSerializer):
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
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_requester_name(self, obj) -> str:
        if obj.user:
            return getattr(obj.user.profile, 'full_name', obj.user.username) if hasattr(obj.user,'profile') else obj.user.username
        return obj.walkin_name if obj.walkin_name else "Walk-in Resident"
    
    def get_purok(self, obj) -> str:
        if obj.user and hasattr(obj.user, 'profile') and obj.user.profile.purok:
            return str(obj.user.profile.purok)
        return str(obj.walkin_purok) if obj.walkin_purok else "N/A"
            

class QueueTicketSerializer(serializers.ModelSerializer):
    ticket_id = serializers.IntegerField(source='id', read_only=True)
    resident_name = serializers.SerializerMethodField()

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
            'notes',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['status', 'ticket_number', 'created_at', 'updated_at']

    def get_resident_name(self, obj) -> str:
        if obj.user:
            return getattr(obj.user.profile, 'full_name', obj.user.username) if hasattr(obj.user, 'profile') else obj.user.username
        # Return the actual typed name, or fallback if none was provided
        return obj.walkin_name if obj.walkin_name else "Walk-in Resident"

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

    