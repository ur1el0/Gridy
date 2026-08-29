from rest_framework import viewsets, permissions
from gridy_auth.permissions import IsBarangayOfficial
from gridy_communications.models import Announcement, ActivitySchedule
from gridy_communications.serializers import AnnouncementSerializer, ActivityScheduleSerializer
from gridy_communications.tasks import async_send_fcm_topic_notification
from gridy_communications.models import FCMDevice
from gridy_communications.serializers import FCMDeviceSerializer
from gridy_auth.models import User
import logging

logger = logging.getLogger(__name__)

class ActivityScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ActivityScheduleSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return ActivitySchedule.objects.none()
        if user.role == User.Role.SUPER_ADMIN:
            return ActivitySchedule.objects.all().order_by('event_datetime', 'created_at')
        return ActivitySchedule.objects.filter(created_by__barangay=user.barangay).order_by('event_datetime', 'created_at')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Anyone logged in (Resident or Official) can read
            return [permissions.IsAuthenticated()]
        # Only officials can write (create, update, delete)
        return [IsBarangayOfficial()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)



class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Announcement.objects.none()
        if user.role == User.Role.SUPER_ADMIN:
            return Announcement.objects.all().order_by('-is_pinned', '-created_at')
        return Announcement.objects.filter(created_by__barangay=user.barangay).order_by('-is_pinned', '-created_at')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsBarangayOfficial()]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        try:
            # Add .delay to push this to Celery queue
            async_send_fcm_topic_notification.delay(
                topic="announcements",
                title="New Announcement",
                body=instance.title,
                data={"announcement_id": str(instance.id)}
            )
        except Exception as e:
            logger.error(f"Failed to send FCM notification for Announcement {instance.id}: {e}")

class FCMDeviceViewSet(viewsets.ModelViewSet):
    serializer_class = FCMDeviceSerializer
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return FCMDevice.objects.none()
        if user.role == User.Role.ADMIN or user.role == User.Role.SUPER_ADMIN:
            return FCMDevice.objects.all()
        return FCMDevice.objects.filter(user=user)

    # Clean up any existing records matching the token to prevent duplicate key crashes 
    def create(self, request, *args, **kwargs):
        token = request.data.get('token')
        if token:
            FCMDevice.objects.filter(token=token).delete()
        return super().create(request, *args, **kwargs)

    # Auto-assign the user during creation
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
