from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from gridy_auth.permissions import IsDILGAdmin
from gridy_auth.models import Barangay, Resident
from .models import DocumentRequest, QueueTicket
from django.db.models import Q
from gridy_reports.models import IssueReport


class DILGAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDILGAdmin]

    def get(self, request):
        analytics_data = []
        barangays = Barangay.objects.all().order_by('name')

        for barangay in barangays:
            # 1. Resident Counts
            total_residents = Resident.objects.filter(user__barangay=barangay).count()
            verified_residents = Resident.objects.filter(user__barangay=barangay, is_verified=True).count()

            # 2. Document Requests
            docs_pending = DocumentRequest.objects.filter(user__barangay=barangay, status=DocumentRequest.Status.PENDING).count()
            docs_released = DocumentRequest.objects.filter(user__barangay=barangay, status=DocumentRequest.Status.RELEASED).count()

            # 3. Queue Tickets
            queue_priority = QueueTicket.objects.filter(barangay=barangay,is_priority=True).count()
            queue_regular = QueueTicket.objects.filter(barangay=barangay,is_priority=False).count()

            scenarios_breakdown = {
                "peace_and_order":IssueReport.objects.filter(reporter__barangay=barangay, category=IssueReport.Category.PEACE_AND_ORDER).count(),
                "public_health":IssueReport.objects.filter(reporter__barangay=barangay, category=IssueReport.Category.PUBLIC_HEALTH).count(),
                "infrastructure":IssueReport.objects.filter(reporter__barangay=barangay, category=IssueReport.Category.INFRASTRUCTURE).count(),
                "environment":IssueReport.objects.filter(reporter__barangay=barangay, category=IssueReport.Category.ENVIRONMENT).count(),
                "other":IssueReport.objects.filter(reporter__barangay=barangay, category=IssueReport.Category.OTHER).count(),
            }

            night_time_incidents = IssueReport.objects.filter(
                Q(reporter__barangay=barangay) &
                (Q(incident_datetime__hour__gte=22) | Q(incident_datetime__hour__lt=5))
            ).count()

            analytics_data.append({
                "barangay_name": barangay.name,
                "residents": {
                    "total": total_residents,
                    "verified": verified_residents,
                },
                "documents": {
                    "pending": docs_pending,
                    "released": docs_released,
                },
                "queue": {
                    "priority": queue_priority,
                    "regular": queue_regular,
                },
                "scenarios": scenarios_breakdown,
                "night_time_incidents": night_time_incidents
            })

        return Response(analytics_data, status=status.HTTP_200_OK)