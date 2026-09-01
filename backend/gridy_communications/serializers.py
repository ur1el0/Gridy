from rest_framework import serializers
from gridy_communications.models import Announcement, ActivitySchedule, FCMDevice, EmergencyHotline

class FCMDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FCMDevice
        fields = ['id', 'token', 'created_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ['created_by']


class ActivityScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivitySchedule
        fields = '__all__'
        read_only_fields = ['created_by']

class EmergencyHotlineSerializer(serializers.Serializer):
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )

    class Meta:
        models = EmergencyHotline
        fields = ['id', 'name', 'number', 'category', 'category_display', 'is_active', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at']