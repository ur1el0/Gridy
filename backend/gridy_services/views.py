from django.contrib.auth import base_user
from django.contrib.auth import base_user
from django.contrib.auth import base_user
from django.contrib.auth import base_user
from django.contrib.auth import base_user
from django.contrib.auth import base_user
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

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

import time
from django.db import connections
from django.core.cache import cache
from django.db.utils import OperationalError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

def broadcast_queue_update():
    """
    Helper to notify all connected WebSockets that the queue has changed.
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'queue_updates',
        {
            'type': 'queue_update' 
        }
    )

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
            return DocumentRequest.objects.filter(user__barangay=user.barangay).select_related('user', 'user__profile').order_by('-created_at')

        if user.role == User.Role.DILG_ADMIN:
            return DocumentRequest.objects.all().select_related('user', 'user_profile').order_by('-created_at')

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
        
        # 1. DILG Admin sees all tickets globally
        if user.role == User.Role.DILG_ADMIN:
            return QueueTicket.objects.all().select_related('user', 'user__profile').order_by('-created_at')

        # 2. Barangay Official only sees tickets for their barangay
        if user.role == User.Role.ADMIN:
            return QueueTicket.objects.filter(barangay=user.barangay).select_related('user','user__profile').order_by('-created_at')

        # 3. Residents only see their own tickets
        return QueueTicket.objects.filter(user=user).select_related('user', 'user__profile').order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user and user.is_authenticated and user.role == User.Role.ADMIN:
            serializer.save(user=None, barangay=user.barangay)
        else: 
            serializer.save(user=user if user.is_authenticated else None, barangay=user.barangay if hasattr(user, 'barangay') else None)
        
        # Trigger WebSocket update
        broadcast_queue_update()

    def perform_update(self, serializer):
        serializer.save()
        # Trigger WebSocket update
        broadcast_queue_update()

    @action(detail=False, methods=['get'], url_path='live-status')
    def live_status(self, request):
        # 1. Grab the tenant ID for isolation
        tenant = request.user.barangay

        # 2. Lock all queries to the specific barangay
        serving_ticket = QueueTicket.objects.filter(status=QueueTicket.Status.SERVING).first()
        total_waiting = QueueTicket.objects.filter(status=QueueTicket.Status.WAITING).count()
        recent_completed = QueueTicket.objects.filter(
            status=QueueTicket.Status.COMPLETED
        ).order_by('-updated_at')[:5]
        
        return Response({
            "current_ticket": serving_ticket.ticket_number if serving_ticket else None,
            "current_service": serving_ticket.service_type if serving_ticket else "General Inquiries",
            "total_waiting": total_waiting,
            "avg_wait_mins": total_waiting * 2,
            "recent_completed": QueueTicketSerializer(recent_completed, many=True).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='next', permission_classes=[IsBarangayOfficial])
    def next_ticket(self, request):
        # 1. Grab the tenant ID for isolation
        tenant = request.user.barangay
        
        with transaction.atomic():
            # 2. Lock the update every query so we don't close other barangays' tickets
            QueueTicket.objects.filter(status=QueueTicket.Status.SERVING, barangay=tenant).update(status=QueueTicket.Status.COMPLETED)
            
            # 3. Lock the fetch query so we don't serve a ticket from another barangay
            next_ticket = QueueTicket.objects.filter(
                status=QueueTicket.Status.WAITING
                ).order_by('-is_priority', 'created_at').first()
            
            if not next_ticket:
                return Response(
                    {"detail": "No tickets waiting in queue."},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            next_ticket.status = QueueTicket.Status.SERVING
            next_ticket.save()

            return Response(QueueTicketSerializer(next_ticket).data)

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
            
            # Trigger WebSocket update
            broadcast_queue_update()

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
        user = request.user

        # 0. Base Queryset Isolation (The Multi-Tenant Guardrail)
        if user.role == User.Role.ADMIN:
            # Strictly lock data to the official's specific Barangay
            base_docs = DocumentRequest.objects.filter(user__barangay=user.barangay)
            base_issues = IssueReport.objects.filter(reporter__barangay=user.barangay)
            base_queue = QueueTicket.objects.filter(barangay=user.barangay)
            base_residents = Resident.objects.filter(user__barangay=user.barangay)
            base_users = User.objects.filter(barangay=user.barangay)
        else: 
            # DILG_ADMIN sees global data across all Barangays
            base_docs = DocumentRequest.objects.all()
            base_issues = IssueReport.objects.all()
            base_queue = QueueTicket.objects.all()
            base_residents = Resident.objects.all()
            base_users = User.objects.all()

# 1. Document request statistics
        doc_total = base_docs.count()
        doc_pending = base_docs.filter(status=DocumentRequest.Status.PENDING).count()
        doc_approved = base_docs.filter(status=DocumentRequest.Status.PROCESSING).count()
        doc_rejected = base_docs.filter(status=DocumentRequest.Status.REJECTED).count()
        doc_released = base_docs.filter(status=DocumentRequest.Status.RELEASED).count()
        
        # 2. Issue reports statistics and urgency breakdown
        issue_total = base_issues.count()
        issue_pending = base_issues.filter(status=IssueReport.Status.PENDING).count()
        issue_in_progress = base_issues.filter(status=IssueReport.Status.IN_PROGRESS).count()
        issue_resolved = base_issues.filter(status=IssueReport.Status.RESOLVED).count()
        
        issues_by_urgency_minor = base_issues.filter(urgency=IssueReport.Urgency.MINOR).count()
        issues_by_urgency_moderate = base_issues.filter(urgency=IssueReport.Urgency.MODERATE).count()
        issues_by_urgency_hazard = base_issues.filter(urgency=IssueReport.Urgency.HAZARD).count()
        issues_by_urgency_emergency = base_issues.filter(urgency=IssueReport.Urgency.EMERGENCY).count()
        # 2b. Scenario / Category Breakdown
        scenarios_breakdown = {
            "peace_and_order": base_issues.filter(category=IssueReport.Category.PEACE_AND_ORDER).count(),
            "public_health": base_issues.filter(category=IssueReport.Category.PUBLIC_HEALTH).count(),
            "infrastructure": base_issues.filter(category=IssueReport.Category.INFRASTRUCTURE).count(),
            "environment": base_issues.filter(category=IssueReport.Category.ENVIRONMENT).count(),
            "other": base_issues.filter(category=IssueReport.Category.OTHER).count(),
        }
        # 2c. Time of Day Analysis (Night: 22:00 - 04:59)
        night_time_incidents = base_issues.filter(
            Q(incident_datetime__hour__gte=22) | Q(incident_datetime__hour__lt=5)
        ).count()
        day_time_incidents = base_issues.filter(
            incident_datetime__hour__gte=5,
            incident_datetime__hour__lt=22,
        ).count()
        # 3. Queue activity stats for today
        today = timezone.now().date()
        queue_total_today = base_queue.filter(created_at__date=today).count()
        serving_ticket = base_queue.filter(status=QueueTicket.Status.SERVING).first()
        queue_waiting_count = base_queue.filter(status=QueueTicket.Status.WAITING).count()
        # 4. Demographics (Purok & Age)
        purok_stats = base_residents.values('purok').annotate(count=Count('purok')).order_by('purok')
        purok_distribution = {
            f"Purok {item['purok']}" if item['purok'] is not None else "Unassigned": item['count']
            for item in purok_stats
        }
        def get_past_date(years):
            try:
                return today.replace(year=today.year - years)
            except ValueError:
                return today.replace(year=today.year - years, day=28)
        
        date_18_years_ago = get_past_date(18)
        date_36_years_ago = get_past_date(36)
        date_60_years_ago = get_past_date(60)
        age_demographics = base_residents.aggregate(
            youth=Count('id', filter=Q(birth_date__gt=date_18_years_ago)),
            young_adult=Count('id', filter=Q(birth_date__lte=date_18_years_ago, birth_date__gt=date_36_years_ago)),
            adult=Count('id', filter=Q(birth_date__lte=date_36_years_ago, birth_date__gt=date_60_years_ago)),
            senior=Count('id', filter=Q(birth_date__lte=date_60_years_ago)),
        )
        return Response ({
            "total_residents": base_users.filter(role=User.Role.RESIDENT).count(),
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
                    "minor": issues_by_urgency_minor,
                    "moderate": issues_by_urgency_moderate,
                    "hazard": issues_by_urgency_hazard,
                    "emergency": issues_by_urgency_emergency,
                },
                "scenario_breakdown": scenarios_breakdown,
                "time_of_day": {
                    "night_time": night_time_incidents,
                    "day_time": day_time_incidents
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

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    System health monitoring endpoint checking Database and Cache dependencies.
    """

    health_data = {
        "status": "healthy",
        "services": {}
    }

    # 1. Database Check
    db_start = time.time()
    try:
        # Pinging the default datanase connection
        connections['default'].cursor()
        db_latency = round((time.time() - db_start) * 1000, 2)
        health_data["services"]["database"] = {
            "status": "healthy",
            "latency_ms": db_latency
        }
    except OperationalError:
        health_data["status"] = "unhealthy"
        health_data["services"]["database"] = {
            "status": "unhealthy",
            "latency_ms": None,
            "error": "Database connection failed"
        }
    
    # 2. Redis Cache Check
    cache_start = time.time()
    try:
        # A simple set and get to verify Redis is actively responding
        cache.set("health_ping", "pong", timeout=5)
        cache_result = cache.get("health_ping")

        if cache_result == "pong":
            cache_latency = round((time.time() - cache_start) * 1000, 2)
            health_data["services"]["cache"] = {
                "status": "healthy",
                "latency_ms": cache_latency
            }
        else:
            raise Exception("Cache write/read verification failed")
    except Exception as e:
        health_data["status"] = "unhealthy"
        health_data["services"]["cache"] = {
            "status": "unhealthy",
            "latency_ms": None,
            "error": str(e)
        }

    # If any service is unhealthy, return a 503 Service Unavailable
    status_code = 200 if health_data["status"] == "healthy" else 503
    return Response(health_data, status=status_code)