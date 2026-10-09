from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from gridy_auth.models import Barangay, User
from gridy_services.models import DocumentRequest


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
