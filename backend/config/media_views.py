import os
from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

class ProtectedMediaView(APIView):
    """
    Serves media files securely with directory-aware access control.
    Ensures that sensitive government IDs and resident billings are strictly
    protected under RA 10173 while public assets (logos, announcements) remain accessible.
    """
    permission_classes = [AllowAny]

    # Directories containing sensitive PII under RA 10173
    SENSITIVE_DIRECTORIES = ('resident_ids/', 'resident_billings/', 'blotter/')

    def get(self, request, path):
        # 1. Enforce Authentication for Sensitive PII
        if path.startswith(self.SENSITIVE_DIRECTORIES):
            if not request.user or not request.user.is_authenticated:
                raise Http404("File not found or access denied.")

        # 2. Resolve absolute file path securely (Fixed misplaced parenthesis)
        document_root = settings.MEDIA_ROOT
        file_path = os.path.abspath(os.path.join(document_root, path))

        # 3. Prevent Directory Traversal Attacks
        if not file_path.startswith(os.path.abspath(document_root)):
            raise Http404("Invalid file path.")

        if not os.path.exists(file_path):
            raise Http404("File not found.")

        # 4. Stream the file directly
        return FileResponse(open(file_path, 'rb'))