
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from gridy_auth.models import User
from gridy_audit.models import AuditLog
from .models import IssueReport

# Create your tests here.

class IssueReportAPITests(APITestCase):
    def setUp(self):
        # Create a test resident user
        self.user = User.objects.create_user(
            username="test_resident",
            password="SecurePassword123!",
            email="resident@example.com",
            role=User.Role.RESIDENT
        )
        self.client.force_login(self.user)
        self.url = reverse('issue-report-list')

    def test_report_creation_default_urgency(self):
        # Create a report without providing the urgency key
        payload = {
            "title": "Flooded street",
            "description": "Purok 1 is flooded",
            "location": "Purok 1"
        }
        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(IssueReport.objects.get(title="Flooded street").urgency, IssueReport.Urgency.MINOR)    

    def test_report_creation_ignores_client_urgency(self):
        # Create a report with EMERGENCY urgency
        payload = {
            "title": "Fallen power line",
            "description": "Live wire exposed",
            "location": "Purok 3",
            "urgency": "EMERGENCY"
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(IssueReport.objects.get(title="Fallen power line").urgency, IssueReport.Urgency.MINOR)

    def test_report_creation_invalid_urgency(self):
        # Try to post with an invalid urgency choice
        payload = {
            "title": "test",
            "description": "test",
            "location": "test",
            "urgency": "CRITICAL" # invalid choice
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_official_cannot_create_issue_report(self):
        # Officials triage and resolve reports; only citizens submit resident community issues
        official = User.objects.create_user(
            username="captain_test",
            password="SecurePassword123!",
            email="captain@example.com",
            role=User.Role.ADMIN
        )
        self.client.force_login(official)
        payload = {
            "title": "Broken pipe",
            "description": "Leaking water",
            "location": "Purok 4"
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_official_can_delete_issue_report_with_audit_log(self):
        official = User.objects.create_user(
            username="captain_delete_test",
            password="SecurePassword123!",
            email="captain_del@example.com",
            role=User.Role.ADMIN
        )
        report = IssueReport.objects.create(
            reporter=self.user,
            title="Spam Report",
            description="Fake text",
            location="Purok 1"
        )
        self.client.force_login(official)
        detail_url = reverse('issue-report-detail', args=[report.id])
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(IssueReport.objects.filter(id=report.id).exists())
        self.assertTrue(
            AuditLog.objects.filter(
                action_type=AuditLog.ActionType.REPORT_ACTION,
                action_by=official
            ).exists()
        )

    def test_resident_cannot_delete_issue_report(self):
        report = IssueReport.objects.create(
            reporter=self.user,
            title="Pothole",
            description="Big pothole",
            location="Purok 2"
        )
        detail_url = reverse('issue-report-detail', args=[report.id])
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(IssueReport.objects.filter(id=report.id).exists())
