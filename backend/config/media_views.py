import os
from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

class ProtectedMediaView(APIView):
    """
    Serves media files securely. Ensures that sensitive government IDs and blotter files
    are not publicly exposed to the internet, fulfilling RA 10173 data privacy mandates.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, path):
        # 1. Base Security: Reject unauthenticated access (handled by IsAuthenticated)
        # In a strict production environment, we could add RBAC here (e.g., verifying
        # the requested resident_id belongs to the request.user or an Admin).

        # 2. Resolve absolute file path securely
        document_root = settings.MEDIA_ROOT
        file_path = os.path.abspath(os.path.join(document_root), path)

        # 3. Prevent Directory Traversal Attacks
        if not file_path.startswith(os.path.abspath(document_root)):
            raise Http404("Invalid file path.")
        
        if not os.path.exists(file_path):
            raise Http404("File not found.")
        
        # 4. Stream the file directly through the authorized session
        return FileResponse(open(file_path, 'rb'))