from rest_framework import serializers


class DocumentStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    released = serializers.IntegerField()
    total_revenue = serializers.FloatField(required=False, default=0.0)


class UrgencyBreakdownSerializer(serializers.Serializer):
    minor = serializers.IntegerField()
    moderate = serializers.IntegerField()
    hazard = serializers.IntegerField()
    emergency = serializers.IntegerField()


class CategoryBreakdownSerializer(serializers.Serializer):
    peace_and_order = serializers.IntegerField()
    public_health = serializers.IntegerField()
    infrastructure = serializers.IntegerField()
    environment = serializers.IntegerField()
    other = serializers.IntegerField()


class IncidentTimingSerializer(serializers.Serializer):
    day_time = serializers.IntegerField()
    night_time = serializers.IntegerField()


class IssueStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    resolved = serializers.IntegerField()
    urgency_breakdown = UrgencyBreakdownSerializer()
    category_breakdown = CategoryBreakdownSerializer()
    scenario_breakdown = CategoryBreakdownSerializer()
    incident_timing = IncidentTimingSerializer()


class AgeDemographicsSerializer(serializers.Serializer):
    youth = serializers.IntegerField()
    young_adult = serializers.IntegerField()
    adult = serializers.IntegerField()
    senior = serializers.IntegerField()


class DemographicsSerializer(serializers.Serializer):
    purok_distribution = serializers.DictField(child=serializers.IntegerField())
    age_demographics = AgeDemographicsSerializer()


class QueueActivitySerializer(serializers.Serializer):
    serving_now = serializers.CharField(allow_null=True)
    waiting_in_queue = serializers.IntegerField()


class DashboardSummarySerializer(serializers.Serializer):
    total_residents = serializers.IntegerField(default=0)
    document_requests = DocumentStatsSerializer()
    issue_reports = IssueStatsSerializer()
    demographics = DemographicsSerializer()
    queue_activity = QueueActivitySerializer()


class DILGAnalyticsRowSerializer(serializers.Serializer):
    barangay_name = serializers.CharField()
    residents = serializers.DictField(child=serializers.IntegerField())
    documents = serializers.DictField(child=serializers.IntegerField())
    queue = serializers.DictField(child=serializers.IntegerField())
    scenarios = serializers.DictField(child=serializers.IntegerField())
    night_time_incidents = serializers.IntegerField()


class PaginatedDILGAnalyticsSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = DILGAnalyticsRowSerializer(many=True)
