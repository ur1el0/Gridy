from unittest.mock import patch

from django.urls import reverse
from rest_framework import status

from gridy_auth.models import Barangay, BarangayApplication, User
from .base import IsolatedAuthAPITestCase


class BarangayOnboardingAPITests(IsolatedAuthAPITestCase):
    def setUp(self):
        self.payload = {
            "name": "Barangay Mabini",
            "municipality": "Lucena City",
            "province": "Quezon",
            "applicant_name": "Maria Santos",
            "applicant_position": "Barangay Secretary",
            "applicant_email": "maria.santos@example.com",
            "applicant_phone": "09171234567",
        }
        self.dilg_admin = User.objects.create_user(
            username="dilg_onboarding_admin",
            email="dilg-onboarding@example.com",
            password="SecurePassword123!",
            role=User.Role.DILG_ADMIN,
            is_staff=True,
        )

    def test_public_application_waits_for_dilg_approval(self):
        response = self.client.post(
            reverse("barangay-application-list"), self.payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        application = BarangayApplication.objects.get(pk=response.data["id"])
        self.assertEqual(application.status, BarangayApplication.Status.PENDING)
        self.assertFalse(Barangay.objects.filter(name="Barangay Mabini").exists())
        self.assertFalse(User.objects.filter(email="maria.santos@example.com").exists())

    def test_pending_application_rejects_duplicate_locality_case_insensitively(self):
        first = self.client.post(
            reverse("barangay-application-list"), self.payload, format="json"
        )
        duplicate = self.client.post(
            reverse("barangay-application-list"),
            {**self.payload, "name": "barangay MABINI", "municipality": "LUCENA CITY"},
            format="json",
        )

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(BarangayApplication.objects.count(), 1)

    @patch("gridy_auth.views.onboarding.send_barangay_approval_email.delay")
    def test_dilg_approval_creates_locality_tenant_and_unusable_password_official(self, send_email):
        created = self.client.post(
            reverse("barangay-application-list"), self.payload, format="json"
        )
        self.client.force_authenticate(self.dilg_admin)

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                reverse("barangay-application-review", args=[created.data["id"]]),
                {"status": BarangayApplication.Status.APPROVED},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        barangay = Barangay.objects.get(
            name="Barangay Mabini", municipality="Lucena City", province="Quezon"
        )
        official = User.objects.get(email="maria.santos@example.com")
        self.assertEqual(official.role, User.Role.ADMIN)
        self.assertEqual(official.barangay, barangay)
        self.assertTrue(official.is_staff)
        self.assertFalse(official.has_usable_password())
        self.assertEqual(response.data["status"], BarangayApplication.Status.APPROVED)
        send_email.assert_called_once()

    @patch("gridy_auth.views.onboarding.send_barangay_approval_email.delay")
    def test_dilg_approval_adds_locality_to_matching_legacy_barangay(self, send_email):
        legacy_barangay = Barangay.objects.create(name=self.payload["name"])
        created = self.client.post(
            reverse("barangay-application-list"), self.payload, format="json"
        )
        self.client.force_authenticate(self.dilg_admin)

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                reverse("barangay-application-review", args=[created.data["id"]]),
                {"status": BarangayApplication.Status.APPROVED},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        legacy_barangay.refresh_from_db()
        self.assertEqual(legacy_barangay.municipality, self.payload["municipality"])
        self.assertEqual(legacy_barangay.province, self.payload["province"])
        self.assertEqual(
            Barangay.objects.filter(name__iexact=self.payload["name"]).count(), 1
        )
        official = User.objects.get(email=self.payload["applicant_email"])
        self.assertEqual(official.barangay, legacy_barangay)
        send_email.assert_called_once()

    def test_dilg_approval_blocks_ambiguous_legacy_barangay_matches(self):
        Barangay.objects.create(name=self.payload["name"])
        Barangay.objects.create(name=self.payload["name"])
        created = self.client.post(
            reverse("barangay-application-list"), self.payload, format="json"
        )
        self.client.force_authenticate(self.dilg_admin)

        response = self.client.post(
            reverse("barangay-application-review", args=[created.data["id"]]),
            {"status": BarangayApplication.Status.APPROVED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Barangay.objects.filter(name=self.payload["name"]).count(), 2)
        self.assertFalse(User.objects.filter(email=self.payload["applicant_email"]).exists())

    def test_only_dilg_admin_can_review_applications(self):
        application = BarangayApplication.objects.create(**self.payload)
        self.client.force_authenticate(
            User.objects.create_user(
                username="unrelated_resident",
                password="SecurePassword123!",
                role=User.Role.RESIDENT,
            )
        )

        response = self.client.post(
            reverse("barangay-application-review", args=[application.pk]),
            {"status": BarangayApplication.Status.APPROVED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(application.status, BarangayApplication.Status.PENDING)

    def test_dilg_review_of_unknown_application_returns_not_found(self):
        self.client.force_authenticate(self.dilg_admin)

        response = self.client.post(
            reverse("barangay-application-review", args=[999999]),
            {"status": BarangayApplication.Status.APPROVED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_application_rejection_requires_reason_and_does_not_create_tenant(self):
        created = self.client.post(
            reverse("barangay-application-list"), self.payload, format="json"
        )
        self.client.force_authenticate(self.dilg_admin)
        review_url = reverse(
            "barangay-application-review", args=[created.data["id"]]
        )

        missing_reason = self.client.post(
            review_url,
            {"status": BarangayApplication.Status.REJECTED},
            format="json",
        )
        rejected = self.client.post(
            review_url,
            {
                "status": BarangayApplication.Status.REJECTED,
                "review_note": "Could not independently verify the applicant.",
            },
            format="json",
        )

        self.assertEqual(missing_reason.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(rejected.status_code, status.HTTP_200_OK)
        self.assertEqual(rejected.data["status"], BarangayApplication.Status.REJECTED)
        self.assertFalse(Barangay.objects.filter(name=self.payload["name"]).exists())
        self.assertFalse(User.objects.filter(email=self.payload["applicant_email"]).exists())

    def test_public_barangay_directory_contains_locality_but_no_private_application_data(self):
        barangay = Barangay.objects.create(
            name="Barangay Mabini", municipality="Lucena City", province="Quezon"
        )
        BarangayApplication.objects.create(**self.payload)

        response = self.client.get(reverse("public-barangay-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["id"], barangay.id)
        self.assertEqual(response.data[0]["municipality"], "Lucena City")
        self.assertNotIn("applicant_email", response.data[0])
        self.assertEqual(len(response.data), 1)
