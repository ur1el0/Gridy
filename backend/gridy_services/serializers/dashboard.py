from rest_framework import serializers


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
