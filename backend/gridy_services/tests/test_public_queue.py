from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from gridy_auth.models import Barangay, User
from gridy_services.models import QueueTicket


class PublicQueueStatusAPITests(APITestCase):
    def setUp(self):
        self.barangay_a = Barangay.objects.create(
            name="Public Queue Barangay A",
            primary_color="#123456",
        )
        self.barangay_b = Barangay.objects.create(
            name="Public Queue Barangay B",
            primary_color="#654321",
        )

        QueueTicket.objects.create(
            barangay=self.barangay_a,
            ticket_number="A-101",
            service_type="DOCUMENT",
            status=QueueTicket.Status.SERVING,
        )
        QueueTicket.objects.create(
            barangay=self.barangay_a,
            ticket_number="A-102",
            service_type="DOCUMENT",
            status=QueueTicket.Status.WAITING,
        )
        QueueTicket.objects.create(
            barangay=self.barangay_b,
            ticket_number="B-201",
            service_type="DOCUMENT",
            status=QueueTicket.Status.SERVING,
        )
        QueueTicket.objects.create(
            barangay=self.barangay_b,
            ticket_number="B-202",
            service_type="DOCUMENT",
            status=QueueTicket.Status.WAITING,
        )

    def test_anonymous_status_is_scoped_to_requested_barangay(self):
        url = reverse(
            "public-queue-status",
            kwargs={"barangay_id": self.barangay_a.pk},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                "barangay_name": "Public Queue Barangay A",
                "primary_color": "#123456",
                "current_ticket": "A-101",
                "total_waiting": 1,
            },
        )

    def test_unknown_barangay_returns_not_found(self):
        url = reverse(
            "public-queue-status",
            kwargs={"barangay_id": 999999},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_existing_live_status_endpoint_still_requires_authentication(self):
        response = self.client.get(reverse("ticket-live-status"))

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_live_status_for_user_without_barangay_returns_empty_summary_and_ignores_null_tickets(self):
        # Create legacy tickets with null barangay
        QueueTicket.objects.create(
            ticket_number="NULL-001",
            status=QueueTicket.Status.SERVING,
            barangay=None,
        )
        QueueTicket.objects.create(
            ticket_number="NULL-002",
            status=QueueTicket.Status.WAITING,
            barangay=None,
        )
        unassigned_user = User.objects.create_user(
            username="unassigned_queue_user",
            password="SecurePassword123!",
            email="unassigned_queue@example.com",
            role=User.Role.RESIDENT,
            barangay=None,
            is_active=True,
        )
        self.client.force_login(unassigned_user)
        response = self.client.get(reverse("ticket-live-status"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                "current_ticket": None,
                "total_waiting": 0,
                "avg_wait_mins": 0,
            },
        )

    def test_live_status_isolates_assigned_barangay_and_ignores_other_barangays(self):
        barangay_a = Barangay.objects.create(name="Barangay Alpha")
        barangay_b = Barangay.objects.create(name="Barangay Beta")

        QueueTicket.objects.create(
            ticket_number="A-001",
            status=QueueTicket.Status.SERVING,
            barangay=barangay_a,
        )
        QueueTicket.objects.create(
            ticket_number="A-002",
            status=QueueTicket.Status.WAITING,
            barangay=barangay_a,
        )
        QueueTicket.objects.create(
            ticket_number="A-003",
            status=QueueTicket.Status.WAITING,
            barangay=barangay_a,
        )

        QueueTicket.objects.create(
            ticket_number="B-001",
            status=QueueTicket.Status.SERVING,
            barangay=barangay_b,
        )
        QueueTicket.objects.create(
            ticket_number="B-002",
            status=QueueTicket.Status.WAITING,
            barangay=barangay_b,
        )

        user_a = User.objects.create_user(
            username="user_alpha",
            password="SecurePassword123!",
            email="user_alpha@example.com",
            role=User.Role.RESIDENT,
            barangay=barangay_a,
            is_active=True,
        )
        self.client.force_login(user_a)
        response = self.client.get(reverse("ticket-live-status"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["current_ticket"], "A-001")
        self.assertEqual(response.data["total_waiting"], 2)
        self.assertEqual(response.data["avg_wait_mins"], 4)
