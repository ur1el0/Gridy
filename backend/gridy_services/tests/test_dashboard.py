from rest_framework import status

from gridy_reports.models import IssueReport
from gridy_services.models import DocumentRequest, QueueTicket
from .base import ServiceAPIBaseTestCase


class DashboardSummaryAPITests(ServiceAPIBaseTestCase):
    def test_dashboard_summary_required_auth(self):
        url = "/api/v1/dashboard/summary/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_summary_blocked_for_residents(self):
        self.client.force_login(self.resident)
        url = "/api/v1/dashboard/summary/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_summary_success_for_official(self):
        self.client.force_login(self.official)

        # Create some mock data to verify aggregation counters
        DocumentRequest.objects.create(
            user=self.resident,
            document_type="Indigency Certificate",
            status="PENDING"
        )
        IssueReport.objects.create(
            reporter=self.resident,
            title="Broken Light",
            description="Dark alley",
            location="Purok 2",
            urgency="HAZARD"
        )
        QueueTicket.objects.create(
            status="SERVING",
            ticket_number="T001",
            service_type="DOCUMENT"
        )

        url = "/api/v1/dashboard/summary/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify JSON structure contains expected keys and data values
        self.assertIn("document_requests", response.data)
        self.assertIn("issue_reports", response.data)
        self.assertIn("queue_activity", response.data)

        # Verify values
        self.assertEqual(response.data["document_requests"]["pending"], 1)
        self.assertEqual(response.data["issue_reports"]["urgency_breakdown"]["hazard"], 1)
        self.assertEqual(response.data["queue_activity"]["serving_now"], "T001")
