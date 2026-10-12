from datetime import date, datetime
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from gridy_auth.models import Barangay, Resident, User
from gridy_reports.models import IssueReport
from gridy_services.models import DocumentRequest, QueueTicket


class DILGAnalyticsAPITests(APITestCase):
    def setUp(self):
        self.barangay_a = Barangay.objects.create(name="Barangay Analytics A")
        self.barangay_b = Barangay.objects.create(name="Barangay Analytics B")

        self.dilg_admin = User.objects.create_user(
            username="dilg_analytics_admin",
            password="SecurePassword123!",
            email="dilg_analytics@example.gov.ph",
            role=User.Role.DILG_ADMIN,
            is_active=True,
        )
        self.barangay_admin = User.objects.create_user(
            username="brgy_analytics_admin",
            password="SecurePassword123!",
            email="brgy_analytics@example.gov.ph",
            role=User.Role.ADMIN,
            barangay=self.barangay_a,
            is_active=True,
        )
        self.resident_a = User.objects.create_user(
            username="resident_analytics_a",
            password="SecurePassword123!",
            email="resident_a@example.com",
            role=User.Role.RESIDENT,
            barangay=self.barangay_a,
            is_active=True,
        )
        self.resident_b = User.objects.create_user(
            username="resident_analytics_b",
            password="SecurePassword123!",
            email="resident_b@example.com",
            role=User.Role.RESIDENT,
            barangay=self.barangay_b,
            is_active=True,
        )
        self.url = reverse("dilg-analytics")

    def test_unauthorized_users_cannot_access_dilg_analytics(self):
        # 1. Anonymous user -> 401
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Barangay Official -> 403
        self.client.force_login(self.barangay_admin)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Resident -> 403
        self.client.force_login(self.resident_a)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_dilg_analytics_includes_walkin_and_digital_clearances_per_barangay(self):
        # Barangay A requests
        # Digital pending
        DocumentRequest.objects.create(
            user=self.resident_a,
            barangay=self.barangay_a,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.PENDING,
        )
        # Walk-in pending (user=None, barangay=barangay_a)
        DocumentRequest.objects.create(
            user=None,
            barangay=self.barangay_a,
            is_walkin=True,
            walkin_name="Walk-in Juan",
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.PENDING,
        )
        # Digital released
        DocumentRequest.objects.create(
            user=self.resident_a,
            barangay=self.barangay_a,
            document_type="Certificate of Indigency",
            status=DocumentRequest.Status.RELEASED,
        )
        # Walk-in released (user=None, barangay=barangay_a)
        DocumentRequest.objects.create(
            user=None,
            barangay=self.barangay_a,
            is_walkin=True,
            walkin_name="Walk-in Maria",
            document_type="Certificate of Residency",
            status=DocumentRequest.Status.RELEASED,
        )
        # Rejected request (should not be counted as pending or released)
        DocumentRequest.objects.create(
            user=self.resident_a,
            barangay=self.barangay_a,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.REJECTED,
        )

        # Barangay B requests
        # Walk-in pending
        DocumentRequest.objects.create(
            user=None,
            barangay=self.barangay_b,
            is_walkin=True,
            walkin_name="Walk-in Pedro",
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.PENDING,
        )
        # Digital released
        DocumentRequest.objects.create(
            user=self.resident_b,
            barangay=self.barangay_b,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.RELEASED,
        )

        self.client.force_login(self.dilg_admin)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data_by_barangay = {item["barangay_name"]: item for item in res.data}
        self.assertIn("Barangay Analytics A", data_by_barangay)
        self.assertIn("Barangay Analytics B", data_by_barangay)

        a_docs = data_by_barangay["Barangay Analytics A"]["documents"]
        self.assertEqual(a_docs["pending"], 2, "Barangay A should have 1 digital + 1 walk-in pending")
        self.assertEqual(a_docs["released"], 2, "Barangay A should have 1 digital + 1 walk-in released")

        b_docs = data_by_barangay["Barangay Analytics B"]["documents"]
        self.assertEqual(b_docs["pending"], 1, "Barangay B should have 1 walk-in pending")
        self.assertEqual(b_docs["released"], 1, "Barangay B should have 1 digital released")

    def test_dilg_analytics_preserves_all_metric_values_and_response_shape(self):
        Resident.objects.create(
            user=self.resident_a,
            full_name="Resident A",
            birth_date=date(1990, 1, 1),
            is_verified=True,
        )
        Resident.objects.create(
            user=self.resident_b,
            full_name="Resident B",
            birth_date=date(1991, 1, 1),
            is_verified=False,
        )

        QueueTicket.objects.create(
            barangay=self.barangay_a,
            ticket_number="A001",
            service_type="Clearance",
            is_priority=True,
        )
        QueueTicket.objects.create(
            barangay=self.barangay_a,
            ticket_number="A002",
            service_type="Clearance",
            is_priority=False,
        )
        QueueTicket.objects.create(
            barangay=self.barangay_b,
            ticket_number="B001",
            service_type="Clearance",
            is_priority=False,
        )

        def create_report(barangay_user, category, hour=None, minute=0):
            incident_datetime = (
                datetime(
                    2026,
                    1,
                    1,
                    hour,
                    minute,
                    tzinfo=ZoneInfo(settings.TIME_ZONE),
                )
                if hour is not None
                else None
            )
            return IssueReport.objects.create(
                reporter=barangay_user,
                title=f"{category} incident",
                description="Analytics test incident",
                location="Test location",
                category=category,
                incident_datetime=incident_datetime,
            )

        create_report(self.resident_a, IssueReport.Category.PEACE_AND_ORDER, 22)
        create_report(self.resident_a, IssueReport.Category.PUBLIC_HEALTH, 4, 59)
        create_report(self.resident_a, IssueReport.Category.INFRASTRUCTURE, 5)
        create_report(self.resident_a, IssueReport.Category.ENVIRONMENT, 21, 59)
        create_report(self.resident_a, IssueReport.Category.OTHER)

        self.client.force_authenticate(user=self.dilg_admin)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item["barangay_name"] for item in response.data],
            sorted([self.barangay_a.name, self.barangay_b.name]),
        )
        self.assertEqual(
            set(response.data[0]),
            {
                "barangay_name",
                "residents",
                "documents",
                "queue",
                "scenarios",
                "night_time_incidents",
            },
        )
        data_by_barangay = {item["barangay_name"]: item for item in response.data}
        a_data = data_by_barangay[self.barangay_a.name]
        self.assertEqual(a_data["residents"], {"total": 1, "verified": 1})
        self.assertEqual(a_data["documents"], {"pending": 0, "released": 0})
        self.assertEqual(a_data["queue"], {"priority": 1, "regular": 1})
        self.assertEqual(
            a_data["scenarios"],
            {
                "peace_and_order": 1,
                "public_health": 1,
                "infrastructure": 1,
                "environment": 1,
                "other": 1,
            },
        )
        self.assertEqual(a_data["night_time_incidents"], 2)

        b_data = data_by_barangay[self.barangay_b.name]
        self.assertEqual(b_data["residents"], {"total": 1, "verified": 0})
        self.assertEqual(b_data["documents"], {"pending": 0, "released": 0})
        self.assertEqual(b_data["queue"], {"priority": 0, "regular": 1})
        self.assertEqual(
            b_data["scenarios"],
            {
                "peace_and_order": 0,
                "public_health": 0,
                "infrastructure": 0,
                "environment": 0,
                "other": 0,
            },
        )
        self.assertEqual(b_data["night_time_incidents"], 0)

    def test_document_counts_keep_or_attribution_and_deduplicate_same_barangay(self):
        DocumentRequest.objects.create(
            user=self.resident_a,
            barangay=self.barangay_a,
            document_type="Same-barangay request",
            status=DocumentRequest.Status.PENDING,
        )
        DocumentRequest.objects.create(
            user=self.resident_a,
            barangay=self.barangay_b,
            document_type="Cross-barangay assignment",
            status=DocumentRequest.Status.PENDING,
        )
        DocumentRequest.objects.create(
            user=self.resident_b,
            barangay=None,
            document_type="User-only assignment",
            status=DocumentRequest.Status.RELEASED,
        )

        self.client.force_authenticate(user=self.dilg_admin)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data_by_barangay = {item["barangay_name"]: item for item in response.data}
        self.assertEqual(
            data_by_barangay[self.barangay_a.name]["documents"],
            {"pending": 2, "released": 0},
        )
        self.assertEqual(
            data_by_barangay[self.barangay_b.name]["documents"],
            {"pending": 1, "released": 1},
        )

    def test_dilg_analytics_query_count_does_not_grow_with_barangay_count(self):
        self.client.force_authenticate(user=self.dilg_admin)

        with CaptureQueriesContext(connection) as small_scope_queries:
            small_scope_response = self.client.get(self.url)
        self.assertEqual(small_scope_response.status_code, status.HTTP_200_OK)

        for index in range(6):
            Barangay.objects.create(name=f"Barangay Analytics Scale {index}")

        with CaptureQueriesContext(connection) as large_scope_queries:
            large_scope_response = self.client.get(self.url)
        self.assertEqual(large_scope_response.status_code, status.HTTP_200_OK)

        self.assertEqual(len(small_scope_queries), 5)
        self.assertEqual(len(small_scope_queries), len(large_scope_queries))
        self.assertLessEqual(len(large_scope_queries), 5)
