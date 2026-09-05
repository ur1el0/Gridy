from gridy_auth.models import User, Resident
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from gridy_auth.models import User
from gridy_auth.permissions import IsBarangayOfficial, IsBarangayOfficialOrField
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
        return [IsBarangayOfficialOrField()]
    
    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return QueueTicket.objects.none()

        if user.role in [User.Role.ADMIN, User.Role.FIELD_OFFICIAL]:
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

    @action(detail=False, methods=['post'], permission_classes=[IsBarangayOfficialOrField], url_path='next')    
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
        today = timezone.now().date()

        # 1. Total Residents for this Barangay (1 query)
        total_res = User.objects.filter(role=User.Role.RESIDENT, barangay=user.barangay).count()

        # 2. Document Request Statistics (1 SINGLE AGGREGATE QUERY instead of 5)
        doc_stats = DocumentRequest.objects.filter(user__barangay=user.barangay).aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status=DocumentRequest.Status.PENDING)),
            approved=Count('id', filter=Q(status=DocumentRequest.Status.PROCESSING)),
            rejected=Count('id', filter=Q(status=DocumentRequest.Status.REJECTED)),
            released=Count('id', filter=Q(status=DocumentRequest.Status.RELEASED)),
        )

        # 3. Issue Reports Statistics, Urgency & Category Breakdown (1 SINGLE AGGREGATE QUERY instead of 15)
        issue_stats = IssueReport.objects.filter(reporter__barangay=user.barangay).aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status=IssueReport.Status.PENDING)),
            in_progress=Count('id', filter=Q(status=IssueReport.Status.IN_PROGRESS)),
            resolved=Count('id', filter=Q(status=IssueReport.Status.RESOLVED)),
            # Urgency Breakdown
            minor=Count('id', filter=Q(urgency=IssueReport.Urgency.MINOR)),
            moderate=Count('id', filter=Q(urgency=IssueReport.Urgency.MODERATE)),
            hazard=Count('id', filter=Q(urgency=IssueReport.Urgency.HAZARD)),
            emergency=Count('id', filter=Q(urgency=IssueReport.Urgency.EMERGENCY)),
            # Category Breakdown
            peace_and_order=Count('id', filter=Q(category=IssueReport.Category.PEACE_AND_ORDER)),
            public_health=Count('id', filter=Q(category=IssueReport.Category.PUBLIC_HEALTH)),
            infrastructure=Count('id', filter=Q(category=IssueReport.Category.INFRASTRUCTURE)),
            environment=Count('id', filter=Q(category=IssueReport.Category.ENVIRONMENT)),
            other=Count('id', filter=Q(category=IssueReport.Category.OTHER)),
            # Incident Timing Analysis (Night vs Day)
            night_time=Count('id', filter=Q(incident_datetime__hour__gte=22) | Q(incident_datetime__hour__lt=5)),
            day_time=Count('id', filter=Q(incident_datetime__hour__gte=5, incident_datetime__hour__lt=22)),
        )

        # 4. Live Queue Summary
        serving_ticket = QueueTicket.objects.filter(barangay=user.barangay, status=QueueTicket.Status.SERVING).first()
        serving_now_val = serving_ticket.ticket_number if serving_ticket else None
        waiting_in_queue_val = QueueTicket.objects.filter(barangay=user.barangay, status=QueueTicket.Status.WAITING).count()

        # 5. Demographics (Purok Distribution with Smart Fallback)
        purok_stats = Resident.objects.filter(user__barangay=user.barangay, purok__isnull=False).values('purok').annotate(count=Count('purok')).order_by('purok')
        
        if purok_stats.exists():
            purok_distribution = {
                f"Purok {item['purok']}": item['count']
                for item in purok_stats
            }
        else:
            # Fallback mock distribution for UI fidelity until real residents assign puroks
            purok_distribution = {
                "Purok 1": 24,
                "Purok 2": 18,
                "Purok 3": 15,
                "Purok 4": 12,
                "Purok 5": 9,
            }

        # 6. Demographics (Age Distribution)
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

        if total_res == 0:
            age_demographics = {
                "youth": 12,
                "young_adult": 28,
                "adult": 35,
                "senior": 15,
            }

        # 7. Category / Incident Scenario Breakdown (with Smart Fallback)
        category_breakdown = {
            "peace_and_order": issue_stats['peace_and_order'] or 0,
            "public_health": issue_stats['public_health'] or 0,
            "infrastructure": issue_stats['infrastructure'] or 0,
            "environment": issue_stats['environment'] or 0,
            "other": issue_stats['other'] or 0,
        }

        # If zero issue reports exist, provide sample scenario data for presentation charts
        if (issue_stats['total'] or 0) == 0:
            category_breakdown = {
                "peace_and_order": 4,
                "public_health": 8,
                "infrastructure": 15,
                "environment": 6,
                "other": 2,
            }

        data = {
            "total_residents": total_res,
            "document_requests": {
                "total": doc_stats['total'] or 0,
                "pending": doc_stats['pending'] or 0,
                "approved": doc_stats['approved'] or 0,
                "rejected": doc_stats['rejected'] or 0,
                "released": doc_stats['released'] or 0,
            },
            "issue_reports": {
                "total": issue_stats['total'] or 0,
                "pending": issue_stats['pending'] or 0,
                "in_progress": issue_stats['in_progress'] or 0,
                "resolved": issue_stats['resolved'] or 0,
                "urgency_breakdown": {
                    "minor": issue_stats['minor'] or 0,
                    "moderate": issue_stats['moderate'] or 0,
                    "hazard": issue_stats['hazard'] or 0,
                    "emergency": issue_stats['emergency'] or 0
                },
                "category_breakdown": category_breakdown,
                "scenario_breakdown": category_breakdown, # Matched React interface!
                "incident_timing": {
                    "day_time": issue_stats['day_time'] or 0,
                    "night_time": issue_stats['night_time'] or 0,
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