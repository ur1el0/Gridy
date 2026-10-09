from gridy_auth.models import Barangay, Resident, User
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from datetime import datetime, time, timedelta

from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone
from drf_spectacular.utils import extend_schema

from gridy_audit.models import AuditLog
from gridy_auth.permissions import IsBarangayOfficial, IsBarangayOfficialOrField
from gridy_services.models import MANILA_TIME_ZONE, QueueTicket, DocumentRequest
from gridy_reports.models import IssueReport
from gridy_services.serializers import (
    DashboardSummarySerializer,
    QueueTicketPrioritySerializer,
    QueueTicketSerializer,
)
from gridy_communications.tasks import send_notification_to_user_task
from gridy_audit.services import log_action
from rest_framework.exceptions import PermissionDenied

class QueueTicketViewSet(viewsets.ModelViewSet):
    serializer_class = QueueTicketSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create', 'live_status', 'cancel_ticket']:
            return [permissions.IsAuthenticated()]
        if self.action == 'set_priority':
            return [IsBarangayOfficial()]
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
        if not user or not user.is_authenticated:
            raise PermissionDenied("Authentication required to generate queue tickets.")

        if (
            user.role in (User.Role.ADMIN, User.Role.RESIDENT)
            and user.barangay_id is None
        ):
            raise PermissionDenied(
                "A barangay assignment is required to generate queue tickets."
            )

        priority_reason = serializer.validated_data.get('priority_reason')
        with transaction.atomic():
            if user.role == User.Role.ADMIN:
                ticket = serializer.save(user=None, barangay=user.barangay)
            elif user.role == User.Role.RESIDENT:
                ticket = serializer.save(
                    user=user,
                    barangay=user.barangay,
                    priority_status=QueueTicket.Priority.REGULAR,
                    is_priority=False,
                )
            else:
                raise PermissionDenied(
                    "Field officials cannot generate queue tickets."
                )

            if ticket.is_priority:
                log_action(
                    user=user,
                    action_type=AuditLog.ActionType.QUEUE_ACTION,
                    description=(
                        f"Official {user.username} issued priority queue ticket "
                        f"{ticket.ticket_number} (ID: {ticket.id}) in "
                        f"{ticket.barangay.name}. Reason: {priority_reason}"
                    ),
                    request=self.request,
                )

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='cancel')
    def cancel_ticket(self, request, pk=None):
        user = request.user

        if user.role not in (
            User.Role.RESIDENT,
            User.Role.ADMIN,
            User.Role.FIELD_OFFICIAL,
        ):
            raise PermissionDenied("You are not allowed to cancel queue tickets.")

        if user.barangay_id is None:
            raise PermissionDenied(
                "A barangay assignment is required to cancel queue tickets."
            )

        with transaction.atomic():
            Barangay.objects.select_for_update().get(pk=user.barangay_id)
            ticket = self.get_object()

            if user.role == User.Role.RESIDENT and ticket.user_id != user.id:
                raise PermissionDenied(
                    "You can only cancel your own queue tickets."
                )

            if ticket.status != QueueTicket.Status.WAITING:
                return Response(
                    {"detail": "Only tickets currently in queue can be cancelled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ticket.status = QueueTicket.Status.CANCELLED
            ticket.save()

            actor_desc = (
                f"Resident {user.username}"
                if user.role == User.Role.RESIDENT
                else f"Official {user.username}"
            )
            log_action(
                user=user,
                action_type=AuditLog.ActionType.QUEUE_ACTION,
                description=(
                    f"{actor_desc} cancelled queue ticket "
                    f"{ticket.ticket_number} (ID: {ticket.id})."
                ),
                request=request,
            )

        return Response(
            {
                "detail": "Queue ticket cancelled successfully.",
                "ticket_number": ticket.ticket_number,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='live-status')
    def live_status(self, request):
        user = request.user
        if not user or not user.is_authenticated or not user.barangay_id:
            return Response({
                "current_ticket": None,
                "total_waiting": 0,
                "avg_wait_mins": 0,
            }, status=status.HTTP_200_OK)

        serving_ticket = QueueTicket.objects.filter(
            barangay_id=user.barangay_id,
            status=QueueTicket.Status.SERVING,
        ).first()
        total_waiting = QueueTicket.objects.filter(
            barangay_id=user.barangay_id,
            status=QueueTicket.Status.WAITING,
        ).count()

        return Response({
            "current_ticket": serving_ticket.ticket_number if serving_ticket else None,
            "total_waiting": total_waiting,
            "avg_wait_mins": total_waiting * 2,
        }, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsBarangayOfficialOrField],
        url_path='complete',
    )
    def complete_ticket(self, request, pk=None):
        user = request.user

        if user.barangay_id is None:
            raise PermissionDenied(
                "A barangay assignment is required to complete queue tickets."
            )

        with transaction.atomic():
            Barangay.objects.select_for_update().get(pk=user.barangay_id)
            ticket = self.get_object()

            if ticket.status != QueueTicket.Status.SERVING:
                return Response(
                    {"detail": "Only the serving ticket can be completed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ticket.status = QueueTicket.Status.COMPLETED
            ticket.save(update_fields=["status", "updated_at"])

            log_action(
                user=user,
                action_type=AuditLog.ActionType.QUEUE_ACTION,
                description=(
                    f"Official {user.username} completed queue ticket "
                    f"{ticket.ticket_number} (ID: {ticket.id})."
                ),
                request=request,
            )

        return Response(
            {
                "detail": "Queue ticket completed successfully.",
                "ticket_number": ticket.ticket_number,
                "status": ticket.status,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(request=QueueTicketPrioritySerializer)
    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsBarangayOfficial],
        url_path='priority',
    )
    def set_priority(self, request, pk=None):
        user = request.user
        if user.barangay_id is None:
            raise PermissionDenied(
                "A barangay assignment is required to change queue priority."
            )

        serializer = QueueTicketPrioritySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_priority_status = serializer.validated_data['priority_status']
        reason = serializer.validated_data['reason']

        with transaction.atomic():
            Barangay.objects.select_for_update().get(pk=user.barangay_id)
            ticket = self.get_object()

            if ticket.status != QueueTicket.Status.WAITING:
                return Response(
                    {"detail": "Priority can only be changed for waiting tickets."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            previous_priority_status = ticket.priority_status
            if previous_priority_status == new_priority_status:
                return Response(
                    {
                        "detail": "Ticket already has the requested priority status.",
                        "priority_status": ticket.priority_status,
                        "is_priority": ticket.is_priority,
                    },
                    status=status.HTTP_200_OK,
                )

            ticket.priority_status = new_priority_status
            ticket.is_priority = (
                new_priority_status == QueueTicket.Priority.PRIORITY
            )
            ticket.save(
                update_fields=["priority_status", "is_priority", "updated_at"]
            )

            log_action(
                user=user,
                action_type=AuditLog.ActionType.QUEUE_ACTION,
                description=(
                    f"Official {user.username} changed queue ticket "
                    f"{ticket.ticket_number} (ID: {ticket.id}) in "
                    f"{ticket.barangay.name} priority from "
                    f"{previous_priority_status} to {new_priority_status}. "
                    f"Reason: {reason}"
                ),
                request=request,
            )

        return Response(
            {
                "detail": "Queue ticket priority updated successfully.",
                "ticket_number": ticket.ticket_number,
                "priority_status": ticket.priority_status,
                "is_priority": ticket.is_priority,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], permission_classes=[IsBarangayOfficialOrField], url_path='next')    
    def next_ticket(self, request):
        user = request.user

        if user.barangay_id is None:
            raise PermissionDenied(
                "A barangay assignment is required to advance the queue."
            )

        with transaction.atomic():
            Barangay.objects.select_for_update().get(pk=user.barangay_id)
            now = timezone.now()
            local_today = timezone.localtime(now, MANILA_TIME_ZONE).date()
            day_start = datetime.combine(
                local_today,
                time.min,
                tzinfo=MANILA_TIME_ZONE,
            )
            next_day_start = day_start + timedelta(days=1)

            QueueTicket.objects.filter(
                barangay_id=user.barangay_id,
                status=QueueTicket.Status.SERVING,
                called_at__isnull=True,
            ).update(called_at=now)
            QueueTicket.objects.filter(
                barangay_id=user.barangay_id,
                status=QueueTicket.Status.SERVING,
            ).update(status=QueueTicket.Status.COMPLETED, updated_at=now)

            served_today = QueueTicket.objects.filter(
                barangay_id=user.barangay_id,
                status__in=(
                    QueueTicket.Status.COMPLETED,
                    QueueTicket.Status.SERVING,
                ),
                called_at__gte=day_start,
                called_at__lt=next_day_start,
            )
            last_regular_call = (
                served_today.filter(is_priority=False)
                .order_by("-called_at", "-id")
                .values("called_at", "id")
                .first()
            )
            priority_calls_since_regular = served_today.filter(is_priority=True)
            if last_regular_call:
                priority_calls_since_regular = priority_calls_since_regular.filter(
                    Q(called_at__gt=last_regular_call["called_at"])
                    | Q(
                        called_at=last_regular_call["called_at"],
                        id__gt=last_regular_call["id"],
                    )
                )

            regular_ticket = (
                QueueTicket.objects.filter(
                    barangay_id=user.barangay_id,
                    status=QueueTicket.Status.WAITING,
                    is_priority=False,
                )
                .order_by("created_at", "id")
                .first()
            )
            priority_ticket = (
                QueueTicket.objects.filter(
                    barangay_id=user.barangay_id,
                    status=QueueTicket.Status.WAITING,
                    is_priority=True,
                )
                .order_by("created_at", "id")
                .first()
            )

            if regular_ticket and priority_ticket:
                next_ticket = (
                    regular_ticket
                    if priority_calls_since_regular.count() >= 2
                    else priority_ticket
                )
            else:
                next_ticket = regular_ticket or priority_ticket

            if not next_ticket:
                return Response(
                    {"detail": "No tickets waiting in queue."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            next_ticket.status = QueueTicket.Status.SERVING
            next_ticket.called_at = now
            next_ticket.save(
                update_fields=["status", "called_at", "updated_at"]
            )

            log_action(
                user=user,
                action_type=AuditLog.ActionType.QUEUE_ACTION,
                description=(
                    f"Advanced queue to ticket {next_ticket.ticket_number} "
                    f"(ID: {next_ticket.id})."
                ),
                request=request,
            )

            if next_ticket.user_id is not None:
                user_id = next_ticket.user_id
                ticket_id = next_ticket.id
                ticket_number = next_ticket.ticket_number

                transaction.on_commit(
                    lambda: send_notification_to_user_task.delay(
                        user_id=user_id,
                        title="Queue Update",
                        body=(
                            f"Your ticket {ticket_number} is now being served!"
                        ),
                        data={"ticket_id": str(ticket_id)},
                    )
                )

            remaining_waiting = QueueTicket.objects.filter(
                barangay_id=user.barangay_id,
                status=QueueTicket.Status.WAITING,
            ).count()

            response_data = {
                "current_ticket": next_ticket.ticket_number,
                "remaining_waiting": remaining_waiting,
            }

        return Response(response_data, status=status.HTTP_200_OK)

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

        # 2. Document Request Statistics (Include digital resident and walk-in records)
        doc_stats = DocumentRequest.objects.filter(
            Q(user__barangay=user.barangay) | Q(barangay=user.barangay)
            ).aggregate(
                total=Count('id'),
                pending=Count('id', filter=Q(status=DocumentRequest.Status.PENDING)),
                approved=Count('id', filter=Q(status=DocumentRequest.Status.PROCESSING)),
                rejected=Count('id', filter=Q(status=DocumentRequest.Status.REJECTED)),
                released=Count('id', filter=Q(status=DocumentRequest.Status.RELEASED)),
                revenue=Sum('fee_amount', filter=Q(status=DocumentRequest.Status.RELEASED)),
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
                item['purok'] if str(item['purok']).lower().startswith('purok') else f"Purok {item['purok']}": item['count']
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
                "total_revenue": float(doc_stats['revenue'] or 0.0)
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
