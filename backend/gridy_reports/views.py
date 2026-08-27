from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import IssueReport
from .serializers import IssueReportSerializer
from gridy_auth.permissions import IsBarangayOfficial
from gridy_auth.models import User

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
        # 3. Parameter override: Force status to PENDING and urgency MINOR
        serializer.save(
            reporter=self.request.user,
            status=IssueReport.Status.PENDING,
            urgency=IssueReport.Urgency.MINOR
        )
