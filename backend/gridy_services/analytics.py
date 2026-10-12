from django.db.models import Count, Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from gridy_auth.models import Barangay, Resident
from gridy_auth.permissions import IsDILGAdmin
from gridy_reports.models import IssueReport

from .models import DocumentRequest, QueueTicket


class DILGAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDILGAdmin]

    def get(self, request):
        barangays = list(
            Barangay.objects.all().order_by("name").values("id", "name")
        )
        barangay_ids = [barangay["id"] for barangay in barangays]
        if not barangay_ids:
            return Response([], status=status.HTTP_200_OK)

        residents_by_barangay = {
            aggregate["user__barangay_id"]: aggregate
            for aggregate in (
                Resident.objects.filter(user__barangay_id__in=barangay_ids)
                .values("user__barangay_id")
                .annotate(
                    total=Count("id"),
                    verified=Count("id", filter=Q(is_verified=True)),
                )
            )
        }

        document_counts_by_barangay = {}
        document_aggregates = (
            DocumentRequest.objects.filter(
                status__in=[
                    DocumentRequest.Status.PENDING,
                    DocumentRequest.Status.RELEASED,
                ]
            )
            .filter(
                Q(user__barangay_id__in=barangay_ids)
                | Q(barangay_id__in=barangay_ids)
            )
            .values("user__barangay_id", "barangay_id", "status")
            .annotate(count=Count("id"))
        )
        barangay_id_set = set(barangay_ids)
        for aggregate in document_aggregates:
            attributed_barangay_ids = {
                aggregate["user__barangay_id"],
                aggregate["barangay_id"],
            } & barangay_id_set
            for barangay_id in attributed_barangay_ids:
                counts = document_counts_by_barangay.setdefault(
                    barangay_id,
                    {
                        DocumentRequest.Status.PENDING: 0,
                        DocumentRequest.Status.RELEASED: 0,
                    },
                )
                counts[aggregate["status"]] += aggregate["count"]

        queue_by_barangay = {
            aggregate["barangay_id"]: aggregate
            for aggregate in (
                QueueTicket.objects.filter(barangay_id__in=barangay_ids)
                .values("barangay_id")
                .annotate(
                    priority=Count("id", filter=Q(is_priority=True)),
                    regular=Count("id", filter=Q(is_priority=False)),
                )
            )
        }

        scenario_fields = (
            (IssueReport.Category.PEACE_AND_ORDER, "peace_and_order"),
            (IssueReport.Category.PUBLIC_HEALTH, "public_health"),
            (IssueReport.Category.INFRASTRUCTURE, "infrastructure"),
            (IssueReport.Category.ENVIRONMENT, "environment"),
            (IssueReport.Category.OTHER, "other"),
        )
        issue_annotations = {
            field_name: Count("id", filter=Q(category=category))
            for category, field_name in scenario_fields
        }
        issue_annotations["night_time_incidents"] = Count(
            "id",
            filter=(
                Q(incident_datetime__hour__gte=22)
                | Q(incident_datetime__hour__lt=5)
            ),
        )
        issues_by_barangay = {
            aggregate["reporter__barangay_id"]: aggregate
            for aggregate in (
                IssueReport.objects.filter(
                    reporter__barangay_id__in=barangay_ids
                )
                .values("reporter__barangay_id")
                .annotate(**issue_annotations)
            )
        }

        analytics_data = []
        for barangay in barangays:
            barangay_id = barangay["id"]
            resident_counts = residents_by_barangay.get(barangay_id, {})
            document_counts = document_counts_by_barangay.get(barangay_id, {})
            queue_counts = queue_by_barangay.get(barangay_id, {})
            issue_counts = issues_by_barangay.get(barangay_id, {})

            analytics_data.append(
                {
                    "barangay_name": barangay["name"],
                    "residents": {
                        "total": resident_counts.get("total", 0),
                        "verified": resident_counts.get("verified", 0),
                    },
                    "documents": {
                        "pending": document_counts.get(
                            DocumentRequest.Status.PENDING, 0
                        ),
                        "released": document_counts.get(
                            DocumentRequest.Status.RELEASED, 0
                        ),
                    },
                    "queue": {
                        "priority": queue_counts.get("priority", 0),
                        "regular": queue_counts.get("regular", 0),
                    },
                    "scenarios": {
                        field_name: issue_counts.get(field_name, 0)
                        for _, field_name in scenario_fields
                    },
                    "night_time_incidents": issue_counts.get(
                        "night_time_incidents", 0
                    ),
                }
            )

        return Response(analytics_data, status=status.HTTP_200_OK)
