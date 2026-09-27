from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.template.loader import get_template
from django.http import HttpResponse
from django.utils import timezone
from xhtml2pdf import pisa
from gridy_auth.models import User
from gridy_auth.permissions import IsBarangayOfficial
from gridy_services.models import DocumentRequest
from gridy_services.serializers import DocumentRequestSerializer, DocumentRequestReviewSerializer
from gridy_communications.tasks import send_notification_to_user_task
from gridy_audit.services import log_action
from gridy_audit.models import AuditLog
from rest_framework.exceptions import PermissionDenied, ValidationError

class DocumentRequestViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentRequestSerializer
    
    def get_permissions(self):
        # Authenticated users can list, view, and download their own approved PDFs
        if self.action in ['list', 'retrieve', 'generate_pdf']:
            return [permissions.IsAuthenticated()]
        
        # Both residents and officials can create (residents for themselves, officials for walk-ins/legacy)
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        
        # Allow authenticated users to access destroy (role and status checks enforced in perform_destroy)
        if self.action == 'destroy':
            return [permissions.IsAuthenticated()]
        return [IsBarangayOfficial()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return DocumentRequest.objects.none()
        
        # Barangay Officials see digital requests from their residents + walk-ins assigned to their barangay
        if user.role in [User.Role.ADMIN, User.Role.FIELD_OFFICIAL]:
            return DocumentRequest.objects.filter(
                Q(user__barangay=user.barangay) | Q(barangay=user.barangay)
            ).order_by('-created_at')

        if user.role == User.Role.DILG_ADMIN:
            return DocumentRequest.objects.all().order_by('-created_at')

        # Residents see only their own requests
        return DocumentRequest.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        data = serializer.validated_data

        if user.role in [User.Role.ADMIN, User.Role.FIELD_OFFICIAL]:
            walkin_name = data.get("walkin_name")

            if not walkin_name or not walkin_name.strip():
                raise ValidationError({
                    "walkin_name": "Walk-in resident's full name is required."
                })
            
            serializer.save(
                user=None,
                barangay=user.barangay,
                is_walkin=True,
                walkin_name=walkin_name.strip(),
                walkin_purok=data.get("walkin_purok") or "",
                or_number=data.get("or_number") or "",
                status=DocumentRequest.Status.PENDING,
                admin_notes="",
            )

            log_action(
                user=user,
                action_type=AuditLog.ActionType.DOCUMENT_ACTION,
                description=(
                    f"Recorded walk-in clearance for {walkin_name.strip()} "
                    f"({data.get('document_type', 'Clearance')})."
                ),
                request=self.request,
            )
            return

        if hasattr(user, "profile") and not user.profile.is_verified:
            raise PermissionDenied(
                "Your account is currently pending verification. Please verify "
                "your residency with Barangay Hall before requesting clearances."
            )
        serializer.save(
            user=user,
            barangay=user.barangay,
            is_walkin=False,
            status=DocumentRequest.Status.PENDING,
            admin_notes="",
        )

    def perform_destroy(self, instance):
        user = self.request.user
        
        # 1. Citizen Resident Self-Service Cancellation
        if user.role == User.Role.RESIDENT:
            if instance.user != user:
                raise PermissionDenied("You can only cancel your own document requests.")
            
            if instance.status != DocumentRequest.Status.PENDING:
                raise ValidationError(
                    {"detail": "You can only cancel document requests that are still pending review."}
                )
            
            log_action(
                user=user,
                action_type=AuditLog.ActionType.DOCUMENT_ACTION,
                description=f"Resident {user.username} cancelled pending document request #{instance.id} ({instance.document_type}).",
                request=self.request
            )
            instance.delete()
            return

        # 2. Barangay Official Administrative Deletion
        if user.role in [User.Role.ADMIN, User.Role.FIELD_OFFICIAL]:
            if instance.status not in [DocumentRequest.Status.RELEASED, DocumentRequest.Status.REJECTED]:
                raise ValidationError(
                    {"detail": "Only resolved (released or rejected) clearance requests can be deleted by officials."}
                )

            recipient_desc = instance.user.username if instance.user else (instance.walkin_name or "Resident")
            log_action(
                user=user,
                action_type=AuditLog.ActionType.DOCUMENT_ACTION,
                description=f"Deleted {instance.get_status_display().lower()} document request #{instance.id} ({instance.document_type}) for {recipient_desc}.",
                request=self.request
            )
            instance.delete()
            return

        raise PermissionDenied("You do not have permission to delete this document request.")

    @action(detail=True, methods=['patch'], permission_classes=[IsBarangayOfficial])
    def validate(self, request, pk=None):
        document_request = self.get_object()
        serializer = DocumentRequestReviewSerializer(
            document_request,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        document_request = serializer.save()

        recipient_desc = (
            document_request.user.username
            if document_request.user
            else document_request.walkin_name
        )

        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.DOCUMENT_ACTION,
            description=(
                f"Validated document request #{document_request.id} "
                f"({document_request.document_type}) for {recipient_desc} "
                f"as {document_request.get_status_display()}."
            ),
            request=request
        )

        if document_request.user:
            send_notification_to_user_task.delay(
                user_id=document_request.user.id,
                title="Document Request Update",
                body=(
                    f"Your request for {document_request.document_type} is now "
                    f"{document_request.get_status_display()}."
                ),
                data={"request_id": str(document_request.id)},
            )

        return Response(
            DocumentRequestSerializer(document_request).data,
            status=status.HTTP_200_OK,
        )

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
        
        # Calculate age if birth_date is present
        age = None
        if resident and resident.birth_date:
            today = timezone.now().date()
            age = today.year - resident.birth_date.year - ((today.month, today.day) < (resident.birth_date.month, resident.birth_date.day))
        
        recipient_name = resident.full_name if resident else (document.walkin_name or "RESIDENT")
        purok_name = {resident.purok if resident else document.walkin_purok} or "N/A"

        context = {
            'document': document,
            'resident': resident,
            'recipient_name': recipient_name,
            'purok_name': purok_name,
            'barangay': barangay,
            'age': age,
            'date_issued': timezone.now()
        }
        
        # Create a Django response object with application/pdf content_type
        response = HttpResponse(content_type='application/pdf')
        safe_filename = document.document_type.replace(' ', '_')
        response['Content-Disposition'] = f'attachment; filename="{safe_filename}_{document.id}.pdf"'
        
        # Render the template to HTML, then convert HTML to PDF
        template = get_template(template_path)
        html = template.render(context)
        
        pisa_status = pisa.CreatePDF(html, dest=response)
        
        if pisa_status.err:
            return Response({"error": "Failed to generate PDF"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return response