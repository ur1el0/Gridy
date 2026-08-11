from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import IssueReport
from .serializers import IssueReportSerializer
from gridy_auth.permissions import IsBarangayOfficial

class IssueReportViewSet(viewsets.ModelViewSet):
    # 1. Fetch all reports, newest first
    queryset = IssueReport.objects.all().order_by('-created_at')
    serializer_class = IssueReportSerializer
    
    # 2. Require authentication to view or submit reports
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            return [permissions.IsAuthenticated()]
        return [IsBarangayOfficial()]

    # 3. Enable handling of image uploads (multipart/form-data)
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # 4. Automatically set the reporter to the logged-in user making the request
    def perform_create(self, serializer):
        # Force status to PENDING during creation
        serializer.save(
            reporter=self.request.user,
            status=IssueReport.Status.PENDING
        )
