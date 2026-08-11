from rest_framework import viewsets, permissions
from gridy_auth.permissions import IsBarangayOfficial
from gridy_communications.models import Announcement, ActivitySchedule
from gridy_communications.serializers import AnnouncementSerializer, ActivityScheduleSerializer
from gridy_communications.services import send_fcm_topic_notification
from gridy_communications.models import FCMDevice
from gridy_communications.serializers import FCMDeviceSerializer
from gridy_auth.models import User


class ActivityScheduleViewSet(viewsets.ModelViewSet):
    queryset = ActivitySchedule.objects.all().order_by('event_datetime', 'created_at')
    serializer_class = ActivityScheduleSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Anyone logged in (Resident or Official) can read
            return [permissions.IsAuthenticated()]
        # Only officials can write (create, update, delete)
        return [IsBarangayOfficial()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all().order_by('-is_pinned', '-created_at')
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsBarangayOfficial()]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        send_fcm_topic_notification(
            topic="announcements",
            title="New Announcement",
            body=instance.title,
            data={"announcement_id": str(instance.id)}
        )

class FCMDeviceViewSet(viewsets.ModelViewSet):
    serializer_class = FCMDeviceSerializer
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return FCMDevice.objects.none()
        if user.role == User.Role.ADMIN:
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