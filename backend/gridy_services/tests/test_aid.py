from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from gridy_audit.models import AuditLog
from gridy_auth.models import Barangay, Resident, User
from gridy_services.models import AidRequest


class AidRequestAPITests(APITestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(name="Aid Workflow Barangay")
        self.other_barangay = Barangay.objects.create(
            name="Other Aid Workflow Barangay"
        )
        self.resident = User.objects.create_user(
            username="aid_resident",
            password="SecurePassword123!",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        Resident.objects.create(
            user=self.resident,
            full_name="Aid Resident",
            birth_date="1992-02-02",
            is_verified=True,
        )
        self.official = User.objects.create_user(
            username="aid_official",
            password="SecurePassword123!",
            role=User.Role.ADMIN,
            barangay=self.barangay,
        )
        self.other_official = User.objects.create_user(
            username="other_aid_official",
            password="SecurePassword123!",
            role=User.Role.ADMIN,
            barangay=self.other_barangay,
        )
        self.url = reverse("aid-request-list")

    def test_resident_can_submit_assistance_request_with_server_owned_fields(self):
        self.client.force_login(self.resident)

        response = self.client.post(
            self.url,
            {
                "assistance_type": "Medical assistance",
                "reason": "Requesting help with a clinic bill.",
                "status": AidRequest.Status.APPROVED,
                "staff_notes": "Forged decision",
                "barangay": self.other_barangay.pk,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        aid_request = AidRequest.objects.get(pk=response.data["id"])
        self.assertEqual(aid_request.requester, self.resident)
        self.assertEqual(aid_request.barangay, self.barangay)
        self.assertEqual(aid_request.status, AidRequest.Status.PENDING)
        self.assertFalse(aid_request.staff_notes)

    def test_resident_can_only_see_own_assistance_requests(self):
        AidRequest.objects.create(
            requester=self.resident,
            barangay=self.barangay,
            assistance_type="Food assistance",
            reason="Temporary household need.",
        )
        self.client.force_login(self.resident)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["requester_name"], "Aid Resident")

    def test_official_review_is_barangay_scoped_audited_and_manual(self):
        aid_request = AidRequest.objects.create(
            requester=self.resident,
            barangay=self.barangay,
            assistance_type="Educational assistance",
            reason="Requesting support for school expenses.",
        )
        self.client.force_login(self.official)

        response = self.client.patch(
            reverse("aid-request-detail", args=[aid_request.pk]),
            {
                "status": AidRequest.Status.APPROVED,
                "staff_notes": "Reviewed by staff.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        aid_request.refresh_from_db()
        self.assertEqual(aid_request.status, AidRequest.Status.APPROVED)
        self.assertEqual(aid_request.reviewed_by, self.official)
        self.assertTrue(
            AuditLog.objects.filter(
                action_by=self.official,
                action_type=AuditLog.ActionType.USER_ACTION,
                description__icontains=f"#{aid_request.pk}",
            ).exists()
        )

    def test_official_cannot_review_another_barangays_request(self):
        aid_request = AidRequest.objects.create(
            requester=self.resident,
            barangay=self.barangay,
            assistance_type="Medical assistance",
            reason="Requesting help with a clinic bill.",
        )
        self.client.force_login(self.other_official)

        response = self.client.patch(
            reverse("aid-request-detail", args=[aid_request.pk]),
            {"status": AidRequest.Status.APPROVED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        aid_request.refresh_from_db()
        self.assertEqual(aid_request.status, AidRequest.Status.PENDING)

    def test_declining_assistance_requires_staff_reason(self):
        aid_request = AidRequest.objects.create(
            requester=self.resident,
            barangay=self.barangay,
            assistance_type="Medical assistance",
            reason="Requesting help with a clinic bill.",
        )
        self.client.force_login(self.official)

        response = self.client.patch(
            reverse("aid-request-detail", args=[aid_request.pk]),
            {"status": AidRequest.Status.DECLINED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        aid_request.refresh_from_db()
        self.assertEqual(aid_request.status, AidRequest.Status.PENDING)

    def test_decided_assistance_request_cannot_be_edited(self):
        aid_request = AidRequest.objects.create(
            requester=self.resident,
            barangay=self.barangay,
            assistance_type="Medical assistance",
            reason="Requesting help with a clinic bill.",
            status=AidRequest.Status.APPROVED,
        )
        self.client.force_login(self.official)

        response = self.client.patch(
            reverse("aid-request-detail", args=[aid_request.pk]),
            {"staff_notes": "Changed after approval."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        aid_request.refresh_from_db()
        self.assertFalse(aid_request.staff_notes)
