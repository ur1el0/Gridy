from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import IssueReport
from .serializers import IssueReportSerializer
from gridy_auth.permissions import IsBarangayOfficial
from gridy_auth.models import User

from gridy_audit.services import log_action
from gridy_audit.models import AuditLog
from gridy_communications.tasks import send_notification_to_user_task

class IssueReportViewSet(viewsets.ModelViewSet):
    serializer_class = IssueReportSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            return [permissions.IsAuthenticated()]
        return [IsBarangayOfficial()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return IssueReport.objects.none()
        # 1. DILG Admin sees all reports globally
        if user.role == User.Role.DILG_ADMIN:
            return IssueReport.objects.all().order_by('-created_at')

        # 2. Barangay Official only sees report from their own residents
        if user.role == User.Role.ADMIN:
            return IssueReport.objects.filter(reporter__barangay=user.barangay).order_by('-created_at')
        
        # 3. Residents only see their own reports
        return IssueReport.objects.filter(reporter=user).order_by('-created_by')

    def perform_create(self, serializer):
        # 1. Capture the old state before saving
        original_status = serializer.instance.status

        # 2. Save the new data
        instance = serializer.save()

        # 3. If the official changed the status, log it and notify
        if original_status != instance.status:
            log_action(
                user=self.request.user,
                action_type=AuditLog.ActionType.REPORT_ACTION,
                description=f"Changed issue report #{instance.id} status from {original_status} to {instance.status}.",
                request=self.request
            )

            # Ping the resident's mobile phone 
            if instance.reporter:
                send_notification_to_user_task.delay(
                    user_id=instance.reporter.id,
                    title="Issue Report Update",
                    body=f"Your issue report '{instance.title}' has been marked as {instance.get_status_display()}.",
                    data={"report_id": str(instance.id)}
                )
                
        serializer.save(
            reporter=self.request.user,
            status=IssueReport.Status.PENDING
        )
