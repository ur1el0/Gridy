from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from gridy_auth.models import User
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
    
