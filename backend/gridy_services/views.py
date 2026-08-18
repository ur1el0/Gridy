from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

from gridy_auth.models import User
from gridy_auth.permissions import IsBarangayOfficial
from .models import DocumentRequest, QueueTicket
from .serializers import DocumentRequestSerializer, QueueTicketSerializer
from gridy_communications.tasks import send_notification_to_user_task

from rest_framework.views import APIView
from django.utils import timezone
from gridy_reports.models import IssueReport

from gridy_audit.services import log_action
from gridy_audit.models import AuditLog

from drf_spectacular.utils import extend_schema
from .serializers import (
    DocumentRequestSerializer,
    QueueTicketSerializer,
    DashboardSummarySerializer,
)

from django.template.loader import get_template
from django.http import HttpResponse
from django.utils import timezone
from xhtml2pdf import pisa
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from django.db.models import Count, Q
from gridy_auth.models import Resident


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
        if user.role == User.Role.ADMIN:
            return DocumentRequest.objects.all().order_by('-created_at')
        return DocumentRequest.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        # Force status to PENDING and clear admin_notes during creation
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
        if new_status not in [DocumentRequest.Status.APPROVED, DocumentRequest.Status.REJECTED, DocumentRequest.Status.RELEASED]:
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
        
        # Only allow PDF generation if the document is APPROVED or RELEASED
        if document.status not in [DocumentRequest.Status.APPROVED, DocumentRequest.Status.RELEASED]:
            return Response(
                {"error": "You can only generate PDFs for approved documents."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        template_path = 'gridy_services/certificate.html'
        context = {
            'document': document,
            'user': document.user,
            'date_issued': timezone.now()
        }
        
        # Create a Django response object, and specify content_type as pdf
        response = HttpResponse(content_type='application/pdf')
        # Instruct the browser to download the file instead of opening it
        filename = f"Barangay_Clearance_{document.id}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Render the template to HTML, then convert HTML to PDF
        template = get_template(template_path)
        html = template.render(context)
        
        pisa_status = pisa.CreatePDF(html, dest=response)
        
        if pisa_status.err:
            return Response({"error": "Failed to generate PDF"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return response


class QueueTicketViewSet(viewsets.ModelViewSet):
    serializer_class = QueueTicketSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create', 'live_status']:
            return [permissions.IsAuthenticated()]
        return [IsBarangayOfficial()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return QueueTicket.objects.none()
        if user.role == User.Role.ADMIN:
            return QueueTicket.objects.all().order_by('-created_at')
        return QueueTicket.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        user  = self.request.user
        # If an admin is creating the ticket, they are issuing it for a walk-in resident.
        # Do not attach the tikcet to the Admin's account.
        if user and user.is_authenticated and user.role == User.Role.ADMIN:
            serializer.save(user=None)
        else:
            # Otherwise, a resident is requesting a ticket for themselves via the app.
            serializer.save(user=user if user.is_authenticated else None)

    @action(detail=False, methods=['get'], url_path='live-status')
    def live_status(self, request):
        serving_ticket = QueueTicket.objects.filter(status=QueueTicket.Status.SERVING).first()
        total_waiting = QueueTicket.objects.filter(status=QueueTicket.Status.WAITING).count()
        
        return Response({
            "current_ticket": serving_ticket.ticket_number if serving_ticket else None,
            "total_waiting": total_waiting,
            "avg_wait_mins": total_waiting * 2 
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='next', permission_classes=[IsBarangayOfficial])
    def next_ticket(self, request):
        with transaction.atomic():
            QueueTicket.objects.filter(status=QueueTicket.Status.SERVING).update(status=QueueTicket.Status.COMPLETED)
            
            next_ticket = QueueTicket.objects.filter(status=QueueTicket.Status.WAITING).order_by('created_at').first()
            
            if not next_ticket:
                return Response(
                    {"detail": "No tickets waiting in queue."},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            next_ticket.status = QueueTicket.Status.SERVING
            next_ticket.save()

            # Log the administrative queue counter advancement
            log_action(
                user=request.user,
                action_type=AuditLog.ActionType.QUEUE_ACTION,
                description=f"Advanced queue to ticket {next_ticket.ticket_number} (ID: {next_ticket.id}).",
                request=request
            )

            # Trigger push notification if the ticket is linkedtoa regsitered resident

            if next_ticket.user:
                send_notification_to_user_task.delay(
                    user_id=next_ticket.user.id,
                    title="Queue Update",
                    body=f"Your ticket {next_ticket.ticket_number} is now being served!",
                    data={"ticket_id": str(next_ticket.id)}
                )
            
            remaining_waiting = QueueTicket.objects.filter(status=QueueTicket.Status.WAITING).count()
            
            return Response({
                "current_ticket": next_ticket.ticket_number,
                "remaining_waiting": remaining_waiting
            }, status=status.HTTP_200_OK)


@extend_schema(
    summary="Get Dashboard Statistics",
    description="Returns pre-calculated counters and urgency distributions for reports, document queues, and clearances.",
    responses={200: DashboardSummarySerializer}
)
class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]

    def get(self, request, *args, **kwargs):

        # 1. Document request statistics
        doc_total = DocumentRequest.objects.count()
        doc_pending = DocumentRequest.objects.filter(status=DocumentRequest.Status.PENDING).count()
        doc_approved = DocumentRequest.objects.filter(status=DocumentRequest.Status.APPROVED).count()
        doc_rejected = DocumentRequest.objects.filter(status=DocumentRequest.Status.REJECTED).count()
        doc_released = DocumentRequest.objects.filter(status=DocumentRequest.Status.RELEASED).count()
        
        # 2. Issue reports statistics and urgency breakdown
        issue_total = IssueReport.objects.count()
        issue_pending = IssueReport.objects.filter(status=IssueReport.Status.PENDING).count()
        issue_in_progress = IssueReport.objects.filter(status=IssueReport.Status.IN_PROGRESS).count()
        issue_resolved = IssueReport.objects.filter(status=IssueReport.Status.RESOLVED).count()
        
        issues_by_urgency_low = IssueReport.objects.filter(urgency=IssueReport.Urgency.LOW).count()
        issues_by_urgency_medium = IssueReport.objects.filter(urgency=IssueReport.Urgency.MEDIUM).count()
        issues_by_urgency_high = IssueReport.objects.filter(urgency=IssueReport.Urgency.HIGH).count()
        issues_by_urgency_urgent = IssueReport.objects.filter(urgency=IssueReport.Urgency.URGENT).count()

        # 3. Queue activity stats for today
        today = timezone.now().date()
        queue_total_today = QueueTicket.objects.filter(created_at__date=today).count()
        serving_ticket = QueueTicket.objects.filter(status=QueueTicket.Status.SERVING).first()
        queue_waiting_count = QueueTicket.objects.filter(status=QueueTicket.Status.WAITING).count()

        # 4. Demographics (Purok & Age)
        # Purok Distribution
        purok_stats = Resident.objects.values('purok').annotate(count=Count('purok')).order_by('purok')
        purok_distribution = {
            f"Purok {item['purok']}" if item['purok'] is not None else  "Unassigned": item['count']
            for item in purok_stats
        }

        # Age Demographics
        today = timezone.now().date()
        def get_past_date(years):
            try:
                return today.replace(year=today.year - years)
            except ValueError:
                return today.replace(year=today.year - years, day=28)
        
        date_18_years_ago = get_past_date(18)
        date_36_years_ago = get_past_date(36)
        date_60_years_ago = get_past_date(60)

        age_demographics = Resident.objects.aggregate(
            youth=Count('id', filter=Q(birth_date__gt=date_18_years_ago)),
            young_adult=Count('id', filter=Q(birth_date__gt=date_18_years_ago, birth_date=date_36_years_ago)),
            adult=Count('id', filter=Q(birth_date__gt=date_36_years_ago, birth_date=date_60_years_ago)),
            senior=Count('id', filter=Q(birth_date__gt=date_60_years_ago)),
        )
        return Response ({
            "total_residents": User.objects.filter(role=User.Role.RESIDENT).count(),
            "document_requests": {
                "total": doc_total,
                "pending": doc_pending,
                "approved": doc_approved,
                "rejected": doc_rejected,
                "released": doc_released
            },
            "issue_reports": {
                "total": issue_total,
                "pending": issue_pending,
                "in_progress": issue_in_progress,
                "resolved": issue_resolved,
                "urgency_breakdown": {
                    "low": issues_by_urgency_low,
                    "medium": issues_by_urgency_medium,
                    "high": issues_by_urgency_high,
                    "urgent": issues_by_urgency_urgent,
                }
            },
            "queue_activity": {
                "total_today": queue_total_today,
                "serving_now": serving_ticket.ticket_number if serving_ticket else None,
                "waiting_count": queue_waiting_count
            },
            "demographics": {
                "purok_distribution": purok_distribution,
                "age_demographics": age_demographics
            }
            
        }, status=status.HTTP_200_OK)

        