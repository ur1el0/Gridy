from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from django.template.loader import get_template
from django.http import HttpResponse
from django.utils import timezone
from xhtml2pdf import pisa

from gridy_auth.models import User
from gridy_auth.permissions import IsBarangayOfficial
from gridy_services.models import DocumentRequest
from gridy_services.serializers import DocumentRequestSerializer
from gridy_communications.tasks import send_notification_to_user_task
from gridy_audit.services import log_action
from gridy_audit.models import AuditLog

class DocumentRequestViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentRequestSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            return [permissions.IsAuthenticated()]
        return [IsBarangayOfficial()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return DocumentRequest.objects.none()
        
        if user.role in [User.Role.ADMIN, User.Role.FIELD_OFFICIAL]:
            return DocumentRequest.objects.filter(user__barangay=user.barangay).order_by('-created_at')

        if user.role == User.Role.DILG_ADMIN:
            return DocumentRequest.objects.all().order_by('-created_at')

        return DocumentRequest.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            status=DocumentRequest.Status.PENDING,
            admin_notes=""
        )

    @action(detail=True, methods=['patch'], permission_classes=[IsBarangayOfficial])
    def validate(self, request, pk=None):
        document_request = self.get_object()
        new_status = request.data.get('status')
        admin_notes = request.data.get('admin_notes', '')

        # Enforce valid transition states
        if new_status not in [
            DocumentRequest.Status.PROCESSING,
            DocumentRequest.Status.READY_FOR_PICKUP,
            DocumentRequest.Status.RELEASED,
            DocumentRequest.Status.REJECTED
        ]:
            return Response(
                {"detail": "Invalid status transition."},
                status=status.HTTP_400_BAD_REQUEST
            )

        document_request.status = new_status
        if admin_notes:
            document_request.admin_notes = admin_notes
        document_request.save()

        # Log the administrative validation action
        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.DOCUMENT_ACTION,
            description=f"Validated document request #{document_request.id} ({document_request.document_type}) as {document_request.get_status_display()}.",
            request=request
        )

        # Trigger push notification to the resident
        send_notification_to_user_task.delay(
            user_id=document_request.user.id,
            title="Document Request Update",
            body=f"Your request for {document_request.document_type} is now {document_request.get_status_display()}.",
            data={"request_id": str(document_request.id)}
        )
        
        return Response(DocumentRequestSerializer(document_request).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='generate-pdf')
    def generate_pdf(self, request, pk=None):
        document = self.get_object()
        
        if document.status not in [DocumentRequest.Status.PROCESSING, DocumentRequest.Status.READY_FOR_PICKUP, DocumentRequest.Status.RELEASED]:
            return Response(
                {"error": "You cannot generate PDFs for pending or rejected documents."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        template_path = 'gridy_services/pdf_clearance.html'
        resident = document.user.profile if hasattr(document.user, 'profile') else None
        barangay = document.user.barangay
        
        # Calculate precise age
        age = None
        if resident and resident.birth_date:
            today = timezone.now().date()
            age = today.year - resident.birth_date.year - ((today.month, today.day) < (resident.birth_date.month, resident.birth_date.day))

        context = {
            'document': document,
            'resident': resident,
            'barangay': barangay,
            'age': age,
            'date_issued': timezone.now()
        }
        
        # Create a Django response object, and specify content_type as pdf
        response = HttpResponse(content_type='application/pdf')
        # Instruct the browser to download the file instead of opening it
        safe_filename = document.document_type.replace(' ', '_')
        response['Content-Disposition'] = f'attachment; filename="{safe_filename}_{document.id}.pdf"'
        
        # Render the template to HTML, then convert HTML to PDF
        template = get_template(template_path)
        html = template.render(context)
        
        pisa_status = pisa.CreatePDF(html, dest=response)
        
        if pisa_status.err:
            return Response({"error": "Failed to generate PDF"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return response