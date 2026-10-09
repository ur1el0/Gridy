from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from django.template.loader import get_template
from django.http import HttpResponse
from django.utils import timezone
from xhtml2pdf import pisa
from gridy_auth.models import User
from gridy_auth.permissions import (
    IsBarangayOfficial,
    IsResident,
    IsResidentOrBarangayOfficial,
)
from gridy_services.models import DocumentRequest
from gridy_services.serializers import (
    DocumentRequestSerializer,
    DocumentRequestReviewSerializer,
    PaymentReferenceSerializer,
    PaymentReviewSerializer,
)
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

        if self.action == "submit_payment_reference":
            return [permissions.IsAuthenticated(), IsResident()]

        if self.action == "create":
            return [
                permissions.IsAuthenticated(),
                IsResidentOrBarangayOfficial(),
            ]
        
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

        if user.role == User.Role.ADMIN:
            if not user.barangay_id:
                raise PermissionDenied(
                    "Your account must be assigned to a barangay to record walk-ins."
                )

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
                or_number="",
                fee_amount=0,
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

        if user.role != User.Role.RESIDENT:
            raise PermissionDenied(
                "Only residents can create personal document requests."
            )

        if hasattr(user, "profile") and not user.profile.is_verified:
            raise PermissionDenied(
                "Your account is currently pending verification. Please verify "
                "your residency with Barangay Hall before requesting clearances."
            )

        serializer.save(
            user=user,
            barangay=user.barangay,
            is_walkin=False,
            walkin_name=None,
            walkin_purok="",
            or_number="",
            fee_amount=0,
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
        with transaction.atomic():
            document_request = DocumentRequest.objects.select_for_update().get(
                pk=self.get_object().pk
            )
            serializer = DocumentRequestReviewSerializer(
                document_request,
                data=request.data,
                partial=True,
            )
            serializer.is_valid(raise_exception=True)
            document_request = serializer.save()
            if document_request.fee_amount <= 0:
                document_request.payment_method = ""
                document_request.payment_reference = ""
                document_request.payment_status = (
                    DocumentRequest.PaymentStatus.NOT_REQUIRED
                )
                document_request.payment_review_note = ""
            elif document_request.payment_status == (
                DocumentRequest.PaymentStatus.NOT_REQUIRED
            ):
                document_request.payment_status = (
                    DocumentRequest.PaymentStatus.UNPAID
                )

            if document_request.status == DocumentRequest.Status.RELEASED:
                if document_request.fee_amount > 0 and not document_request.or_number:
                    raise ValidationError({
                        "or_number": (
                            "An official receipt number is required before release."
                        )
                    })
                if document_request.fee_amount > 0:
                    if document_request.payment_method == (
                        DocumentRequest.PaymentMethod.CASH
                    ):
                        document_request.payment_status = (
                            DocumentRequest.PaymentStatus.VERIFIED
                        )
                    elif document_request.payment_method == (
                        DocumentRequest.PaymentMethod.GCASH
                    ):
                        if document_request.payment_status != (
                            DocumentRequest.PaymentStatus.VERIFIED
                        ):
                            raise ValidationError({
                                "payment_status": (
                                    "Verify the GCash transfer before releasing "
                                    "this document."
                                )
                            })
                    else:
                        raise ValidationError({
                            "payment_method": (
                                "Record whether payment was made by cash or GCash."
                            )
                        })

            document_request.save(
                update_fields=[
                    "payment_method",
                    "payment_reference",
                    "payment_status",
                    "payment_review_note",
                    "updated_at",
                ]
            )
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

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsResident],
        url_path="payment-reference",
        url_name="payment-reference",
    )
    def submit_payment_reference(self, request, pk=None):
        serializer = PaymentReferenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            document_request = DocumentRequest.objects.select_for_update().get(
                pk=self.get_object().pk,
                user_id=request.user.id,
            )
            if document_request.status != DocumentRequest.Status.READY_FOR_PICKUP:
                raise ValidationError({
                    "detail": "Payment details can be submitted after the document is ready."
                })
            if document_request.fee_amount <= 0:
                raise ValidationError({
                    "detail": "This request does not require a payment."
                })
            if document_request.payment_status not in {
                DocumentRequest.PaymentStatus.UNPAID,
                DocumentRequest.PaymentStatus.REJECTED,
            }:
                raise ValidationError({
                    "detail": "This payment is already awaiting review or verified."
                })

            document_request.payment_method = DocumentRequest.PaymentMethod.GCASH
            document_request.payment_reference = serializer.validated_data[
                "payment_reference"
            ]
            document_request.payment_status = (
                DocumentRequest.PaymentStatus.PENDING_VERIFICATION
            )
            document_request.payment_review_note = ""
            document_request.save(
                update_fields=[
                    "payment_method",
                    "payment_reference",
                    "payment_status",
                    "payment_review_note",
                    "updated_at",
                ]
            )
            log_action(
                user=request.user,
                action_type=AuditLog.ActionType.DOCUMENT_ACTION,
                description=(
                    f"Resident submitted a GCash reference for document request "
                    f"#{document_request.id}."
                ),
                request=request,
            )
        return Response(
            DocumentRequestSerializer(document_request).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[IsBarangayOfficial],
        url_path="payment-review",
        url_name="payment-review",
    )
    def review_payment(self, request, pk=None):
        serializer = PaymentReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            document_request = DocumentRequest.objects.select_for_update().get(
                pk=self.get_object().pk
            )
            if (
                document_request.payment_method != DocumentRequest.PaymentMethod.GCASH
                or document_request.payment_status
                != DocumentRequest.PaymentStatus.PENDING_VERIFICATION
            ):
                raise ValidationError({
                    "detail": "Only pending GCash references can be reviewed."
                })

            payment_status = serializer.validated_data["status"]
            note = serializer.validated_data.get("note", "").strip()
            document_request.payment_status = payment_status
            document_request.payment_review_note = note
            document_request.save(
                update_fields=[
                    "payment_status",
                    "payment_review_note",
                    "updated_at",
                ]
            )
            log_action(
                user=request.user,
                action_type=AuditLog.ActionType.DOCUMENT_ACTION,
                description=(
                    f"Official {request.user.username} marked GCash payment for "
                    f"document request #{document_request.id} as {payment_status}."
                    + (f" Note: {note}" if note else "")
                ),
                request=request,
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
        resident = (
            document.user.profile
            if document.user_id and hasattr(document.user, 'profile')
            else None
        )
        barangay = document.barangay

        if barangay is None and document.user_id:
            barangay = document.user.barangay

        if barangay is None:
            raise ValidationError({
                "detail": "A barangay must be assigned before generating this PDF."
            })

        # Calculate age if birth_date is present
        age = None
        if resident and resident.birth_date:
            today = timezone.now().date()
            age = today.year - resident.birth_date.year - ((today.month, today.day) < (resident.birth_date.month, resident.birth_date.day))
        
        recipient_name = resident.full_name if resident else (document.walkin_name or "RESIDENT")
        if resident:
            purok_name = f"Purok {resident.purok}" if resident.purok else "N/A"
        else:
            purok_name = document.walkin_purok or "N/A"

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
