from rest_framework import serializers
from .models import DocumentRequest, QueueTicket

class DocumentRequestSerializer(serializers.ModelSerializer):
    request_id = serializers.IntegerField(source='id', read_only=True)
    requester_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentRequest
        fields = [
            'request_id',
            'requester_name',
            'document_type',
            'urgency_tag',
            'status',
            'admin_notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_requester_name(self, obj) -> str:
        user = obj.user
        return getattr(user.profile, 'full_name', user.username) if hasattr(user,'profile') else user.username

class QueueTicketSerializer(serializers.ModelSerializer):
    ticket_id = serializers.IntegerField(source='id', read_only=True)

    class Meta:
        model = QueueTicket
        fields = [
            'ticket_id',
            'ticket_number',
            'service_type',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['status', 'ticket_number', 'created_at', 'updated_at']


class DocumentStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    released = serializers.IntegerField()

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

    