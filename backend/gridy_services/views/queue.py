from gridy_auth.models import User
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from drf_spectacular.utils import extend_schema
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from gridy_auth.models import User
from gridy_auth.permissions import IsBarangayOfficial
from gridy_services.models import QueueTicket, DocumentRequest
from gridy_reports.models import IssueReport
from gridy_services.serializers import QueueTicketSerializer, DashboardSummarySerializer
from gridy_communications.tasks import send_notification_to_user_task
from gridy_audit.services import log_action
from gridy_audit.models import AuditLog


def broadcast_queue_update():
    """Helper to notify all connected WebSockets that the queue has changed."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'queue_updates',
        {
            'type': 'queue_message',
            'message': 'UPDATE'
        }
    )

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
            return QueueTicket.objects.filter(barangay=user.barangay).order_by('-created_at')

        if user.role == User.Role.DILG_ADMIN:
            return QueueTicket.objects.all().order_by('-created_at')

        return QueueTicket.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user and user.is_authenticated and user.role == User.Role.ADMIN:
            serializer.save(user=None, barangay=user.barangay)
        else: 
            serializer.save(user=user if user.is_authenticated else None, barangay=user.barangay if hasattr(user, 'barangay') else None)
        
        broadcast_queue_update()

    def perform_update(self, serializer):
        serializer.save()
        broadcast_queue_update()

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
            next_ticket = QueueTicket.objects.filter(status=QueueTicket.Status.WAITING).order_by('-is_priority', 'created_at').first()
            
            if not next_ticket:
                return Response({"detail": "No tickets waiting in queue."}, status=status.HTTP_404_NOT_FOUND)
                
            next_ticket.status = QueueTicket.Status.SERVING
            next_ticket.save()

            log_action(
                user=request.user,
                action_type=AuditLog.ActionType.QUEUE_ACTION,
                description=f"Advanced queue to ticket {next_ticket.ticket_number} (ID: {next_ticket.id}).",
                request=request
            )

            if next_ticket.user:
                send_notification_to_user_task.delay(
                    user_id=next_ticket.user.id,
                    title="Queue Update",
                    body=f"Your ticket {next_ticket.ticket_number} is now being served!",
                    data={"ticket_id": str(next_ticket.id)}
                )
            
            remaining_waiting = QueueTicket.objects.filter(status=QueueTicket.Status.WAITING).count()
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

        # 0. Total Residents for this Barangay
        total_res = User.objects.filter(role=User.Role.RESIDENT, barangay=user.barangay).count()

        # 1. Document request statistics
        doc_total = DocumentRequest.objects.count()
        doc_pending = DocumentRequest.objects.filter(status=DocumentRequest.Status.PENDING).count()
        doc_approved = DocumentRequest.objects.filter(status=DocumentRequest.Status.PROCESSING).count()
        doc_rejected = DocumentRequest.objects.filter(status=DocumentRequest.Status.REJECTED).count()
        doc_released = DocumentRequest.objects.filter(status=DocumentRequest.Status.RELEASED).count()
        
        # 2. Issue reports statistics and urgency breakdown
        issue_total = IssueReport.objects.count()
        issue_pending = IssueReport.objects.filter(status=IssueReport.Status.PENDING).count()
        issue_in_progress = IssueReport.objects.filter(status=IssueReport.Status.IN_PROGRESS).count()
        issue_resolved = IssueReport.objects.filter(status=IssueReport.Status.RESOLVED).count()
        
        issues_by_urgency_minor = IssueReport.objects.filter(urgency=IssueReport.Urgency.MINOR).count()
        issues_by_urgency_moderate = IssueReport.objects.filter(urgency=IssueReport.Urgency.MODERATE).count()
        issues_by_urgency_hazard = IssueReport.objects.filter(urgency=IssueReport.Urgency.HAZARD).count()
        issues_by_urgency_emergency = IssueReport.objects.filter(urgency=IssueReport.Urgency.EMERGENCY).count()

        # 2b. Scenario / Category Breakdown
        scenarios_breakdown = {
            "peace_and_order": IssueReport.objects.filter(category=IssueReport.Category.PEACE_AND_ORDER).count(),
            "public_health": IssueReport.objects.filter(category=IssueReport.Category.PUBLIC_HEALTH).count(),
            "infrastructure": IssueReport.objects.filter(category=IssueReport.Category.INFRASTRUCTURE).count(),
            "environment": IssueReport.objects.filter(category=IssueReport.Category.ENVIRONMENT).count(),
            "other": IssueReport.objects.filter(category=IssueReport.Category.OTHER).count(),
        }

        # 2c. Time of Day Analysis (Night: 22:00 - 04:59)
        night_time_incidents = IssueReport.objects.filter(
            Q(incident_datetime__hour__gte=22) | Q(incident_datetime__hour__lt=5)
        ).count()
        day_time_incidents = IssueReport.objects.filter(
            incident_datetime__hour__gte=5,
            incident_datetime__hour__lt=22,
        ).count()

        # 3. Live Queue Summary
        serving_ticket = QueueTicket.objects.filter(status=QueueTicket.Status.SERVING).first()
        serving_now_val = serving_ticket.ticket_number if serving_ticket else None
        waiting_in_queue_val = QueueTicket.objects.filter(status=QueueTicket.Status.WAITING).count()


        # 4. Demographics (Purok & Age)
        from gridy_auth.models import Resident
        from django.db.models import Count, Q
        from django.utils import timezone

        purok_stats = Resident.objects.filter(user__barangay=user.barangay).values('purok').annotate(count=Count('purok')).order_by('purok')
        purok_distribution = {
            f"Purok {item['purok']}" if item['purok'] is not None else "Unassigned": item['count']
            for item in purok_stats
        }

        today = timezone.now().date()
        def get_past_date(years):
            try:
                return today.replace(year=today.year - years)
            except ValueError:
                return today.replace(year=today.year - years, day=28)
        
        date_18_years_ago = get_past_date(18)
        date_36_years_ago = get_past_date(36)
        date_60_years_ago = get_past_date(60)

        age_demographics = Resident.objects.filter(user__barangay=user.barangay).aggregate(
            youth=Count('id', filter=Q(birth_date__gt=date_18_years_ago)),
            young_adult=Count('id', filter=Q(birth_date__lte=date_18_years_ago, birth_date__gt=date_36_years_ago)),
            adult=Count('id', filter=Q(birth_date__lte=date_36_years_ago, birth_date__gt=date_60_years_ago)),
            senior=Count('id', filter=Q(birth_date__lte=date_60_years_ago)),
        )

        data = {
            "total_residents": total_res,
            "document_requests": {
                "total": doc_total,
                "pending": doc_pending,
                "approved": doc_approved,
                "rejected": doc_rejected,
                "released": doc_released,
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
                    "emergency": issues_by_urgency_emergency
                },
                "category_breakdown": scenarios_breakdown,
                "incident_timing": {
                    "day_time": day_time_incidents,
                    "night_time": night_time_incidents,
                }
            },
            "demographics": {
                "purok_distribution": purok_distribution,
                "age_demographics": age_demographics
            },
            "queue_activity": {
                "serving_now": serving_now_val,
                "waiting_in_queue": waiting_in_queue_val,
            }
        }
        return Response(data, status=status.HTTP_200_OK)