from rest_framework import serializers
from gridy_auth.models import User
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

    def validate_image(self, value):
        if value:
            max_size = 5 * 1024 * 1024 # 5 Megabytes
            if value.size > max_size:
                raise serializers.ValidationError("Image file size cannot exceed 5MB. Please compress your image.")
            return value

    def validate_navigator_ai_enabled(self, value):
        if value:
            request = self.context.get('request')
            if request and hasattr(request, 'user') and request.user.is_authenticated:
                user = request.user
                if user.role == User.Role.DILG_ADMIN:
                    raise serializers.ValidationError("DILG administrators cannot enable AI sharing across barangays.")
                if user.role not in [User.Role.ADMIN, User.Role.FIELD_OFFICIAL]:
                    raise serializers.ValidationError("Only authorized barangay staff may enable AI sharing.")
                if not user.barangay_id:
                    raise serializers.ValidationError("A barangay assignment is required to enable AI sharing.")
        return value


class PublicAnnouncementSerializer(serializers.ModelSerializer):
    barangay_id = serializers.IntegerField(source="created_by.barangay_id", read_only=True)

    class Meta:
        model = Announcement
        fields = ["id", "barangay_id", "title", "content", "is_pinned", "created_at"]
        read_only_fields = fields


class ActivityScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivitySchedule
        fields = '__all__'
        read_only_fields = ['created_by']

    def validate_navigator_ai_enabled(self, value):
        if value:
            request = self.context.get('request')
            if request and hasattr(request, 'user') and request.user.is_authenticated:
                user = request.user
                if user.role == User.Role.DILG_ADMIN:
                    raise serializers.ValidationError("DILG administrators cannot enable AI sharing across barangays.")
                if user.role not in [User.Role.ADMIN, User.Role.FIELD_OFFICIAL]:
                    raise serializers.ValidationError("Only authorized barangay staff may enable AI sharing.")
                if not user.barangay_id:
                    raise serializers.ValidationError("A barangay assignment is required to enable AI sharing.")
        return value

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
