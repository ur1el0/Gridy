from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import IssueReport
from .serializers import IssueReportSerializer
from gridy_auth.permissions import IsBarangayOfficial, IsBarangayOfficialOrField, IsResident
from gridy_auth.models import User

from gridy_audit.services import log_action
from gridy_audit.models import AuditLog
from gridy_communications.tasks import send_notification_to_user_task

class IssueReportViewSet(viewsets.ModelViewSet):
    serializer_class = IssueReportSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_permissions(self):
        # Only authenticated users can list/retrieve
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # Strictly residents can file new community reports
        if self.action == 'create':
            return [IsResident()]
        # Strictly officials can update status, triage, and resolve
        return [IsBarangayOfficialOrField()]
    
    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return IssueReport.objects.none()

        # DILG Super Admins can see the entire database
        if user.role == User.Role.DILG_ADMIN:
            return IssueReport.objects.all().order_by('-created_at')

        # Barangay Officials only see reports from residents in their specific Barangay
        if user.role in [User.Role.ADMIN, User.Role.FIELD_OFFICIAL]:
            return IssueReport.objects.filter(reporter__barangay=user.barangay).order_by('-created_at')
        
        # Standard Residents only see their own reports (and we fixed the created_by typo)
        return IssueReport.objects.filter(reporter=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(
            reporter=self.request.user,
            status=IssueReport.Status.PENDING,
            urgency=IssueReport.Urgency.MINOR
        )

    def perform_update(self, serializer):
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
