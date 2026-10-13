from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from gridy_auth.models import Barangay, Resident, User


class AuthListPaginationTests(APITestCase):
    def test_pending_residents_list_supports_page_and_page_size(self):
        barangay = Barangay.objects.create(name="Paginated Auth Barangay")
        official = User.objects.create_user(
            username="pagination_official",
            email="pagination-official@example.test",
            password="SecurePassword123!",
            role=User.Role.ADMIN,
            barangay=barangay,
        )
        for index in range(3):
            resident = User.objects.create_user(
                username=f"pending_resident_{index}",
                email=f"pending-{index}@example.test",
                password="SecurePassword123!",
                role=User.Role.RESIDENT,
                barangay=barangay,
            )
            Resident.objects.create(
                user=resident,
                full_name=f"Pending Resident {index}",
                birth_date="1990-01-01",
                is_verified=False,
            )
        self.client.force_login(official)

        response = self.client.get(
            reverse("pending_residents"), {"page": 2, "page_size": 2}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(response.data), {"count", "next", "previous", "results"})
        self.assertEqual(response.data["count"], 3)
        self.assertEqual(len(response.data["results"]), 1)

    def test_public_barangay_directory_returns_paginated_results(self):
        for index in range(3):
            Barangay.objects.create(name=f"Public Pagination Barangay {index}")

        response = self.client.get(
            reverse("public-barangay-list"), {"page": 2, "page_size": 2}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(response.data), {"count", "next", "previous", "results"})
        self.assertEqual(response.data["count"], 3)
        self.assertEqual(len(response.data["results"]), 1)
