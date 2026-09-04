from rest_framework import serializers
from gridy_communications.models import Announcement, ActivitySchedule, FCMDevice, EmergencyHotline, FAQ, AdminNotification

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

class EmergencyHotlineSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )

    class Meta:
        model = EmergencyHotline
        fields = ['id', 'name', 'number', 'category', 'category_display', 'is_active', 'created_by']
        read_only_fields = ['created_by']

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = '__all__'

class AdminNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNotification
        fields = '__all__'
        read_only_fields = ['user', 'created_at']