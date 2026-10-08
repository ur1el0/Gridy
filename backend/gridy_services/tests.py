from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone as datetime_timezone
from importlib import import_module
from threading import Barrier
from types import SimpleNamespace
from unittest.mock import patch

from django.apps import apps
from django.db import close_old_connections, connection, connections
from django.test import (
    TransactionTestCase,
    override_settings,
    skipUnlessDBFeature,
)
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate

from gridy_audit.models import AuditLog
from gridy_auth.models import Barangay, Resident, User
from gridy_reports.models import IssueReport
from gridy_services.models import AidRequest, DocumentRequest, QueueTicket
from gridy_services.views.queue import QueueTicketViewSet
# Create your tests here.

class ServiceAPITests(APITestCase):
    def setUp(self):
        # Create an official (admin)
        self.official = User.objects.create_user(
            username="official_test",
            password="SecurePassword123!",
            email="admin@example.com",
            role=User.Role.ADMIN
        )
        # Create a verified resident
        self.resident = User.objects.create_user(
            username="resident_test",
            password="SecurePassword123!",
            email="resident@example.com",
            role=User.Role.RESIDENT
        )
        Resident.objects.create(
            user=self.resident,
            full_name="Resident Test",
            birth_date="1995-05-15",
            is_verified=True
        )
    
    # Example 1: Resident successfully requests a document
    def test_resident_can_create_document_request(self):
        self.client.force_login(self.resident)
        url = reverse('document-request-list')
        response = self.client.post(
            url,
            {
                "document_type": "Barangay Clearance",
                "status": DocumentRequest.Status.RELEASED,
                "admin_notes": "Forged notes",
                "is_walkin": True,
                "walkin_name": "Forged Walk-in Applicant",
                "walkin_purok": "Purok 99",
                "or_number": "FORGED-OR",
                "fee_amount": "999.00",
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_request = DocumentRequest.objects.get(pk=response.data["id"])
        self.assertEqual(created_request.user, self.resident)
        self.assertEqual(created_request.status, DocumentRequest.Status.PENDING)
        self.assertEqual(created_request.admin_notes, "")
        self.assertFalse(created_request.is_walkin)
        self.assertFalse(created_request.walkin_name)
        self.assertFalse(created_request.walkin_purok)
        self.assertFalse(created_request.or_number)
        self.assertEqual(str(created_request.fee_amount), "0.00")

    def test_official_can_create_walkin_document_request(self):
        barangay = Barangay.objects.create(name="Walk-in Test Barangay")
        self.official.barangay = barangay
        self.official.save(update_fields=["barangay"])
        self.client.force_login(self.official)
        url = reverse('document-request-list')
        response = self.client.post(
            url,
            {
                "document_type": "Barangay Clearance",
                "walkin_name": "Juan Dela Cruz",
                "walkin_purok": "Purok 3",
                "is_walkin": False,
                "status": DocumentRequest.Status.RELEASED,
                "admin_notes": "Forged notes",
                "or_number": "FORGED-OR",
                "fee_amount": "999.00",
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_request = DocumentRequest.objects.get(pk=response.data["id"])
        self.assertTrue(created_request.is_walkin)
        self.assertEqual(created_request.walkin_name, "Juan Dela Cruz")
        self.assertEqual(created_request.barangay, barangay)
        self.assertIsNone(created_request.user)
        self.assertEqual(created_request.status, DocumentRequest.Status.PENDING)
        self.assertEqual(created_request.admin_notes, "")
        self.assertFalse(created_request.or_number)
        self.assertEqual(str(created_request.fee_amount), "0.00")

    @patch("gridy_services.views.documents.pisa.CreatePDF")
    def test_official_can_generate_walkin_pdf(self, create_pdf):
        barangay = Barangay.objects.create(name="Walk-in PDF Test Barangay")
        self.official.barangay = barangay
        self.official.save(update_fields=["barangay"])
        self.client.force_login(self.official)

        document_request = DocumentRequest.objects.create(
            barangay=barangay,
            is_walkin=True,
            walkin_name="Juan Dela Cruz",
            walkin_purok="Purok Maligaya",
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.RELEASED,
        )
        create_pdf.return_value.err = False

        response = self.client.get(
            reverse(
                "document-request-generate-pdf",
                args=[document_request.pk],
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")

        rendered_html = create_pdf.call_args.args[0]
        self.assertIn("JUAN DELA CRUZ", rendered_html)
        self.assertIn(barangay.name, rendered_html)
        self.assertIn("<strong>Purok Maligaya</strong>", rendered_html)
        self.assertNotIn(
            "Purok <strong>Purok Maligaya</strong>",
            rendered_html,
        )

    @patch("gridy_services.views.documents.pisa.CreatePDF")
    def test_resident_pdf_preserves_purok_number(self, create_pdf):
        barangay = Barangay.objects.create(name="Resident PDF Test Barangay")
        self.resident.barangay = barangay
        self.resident.save(update_fields=["barangay"])

        resident_profile = self.resident.profile
        resident_profile.purok = "3"
        resident_profile.save(update_fields=["purok"])

        document_request = DocumentRequest.objects.create(
            user=self.resident,
            barangay=barangay,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.RELEASED,
        )
        self.client.force_login(self.resident)
        create_pdf.return_value.err = False

        response = self.client.get(
            reverse(
                "document-request-generate-pdf",
                args=[document_request.pk],
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")

        rendered_html = create_pdf.call_args.args[0]
        self.assertIn("<strong>Purok 3</strong>", rendered_html)

    def test_official_creating_walkin_requires_name(self):
        # Walk-in submissions without a resident name are rejected with 400
        self.official.barangay = Barangay.objects.create(
            name="Walk-in Name Test Barangay"
        )
        self.official.save(update_fields=["barangay"])
        self.client.force_login(self.official)

        url = reverse('document-request-list')
        payload = {
            "document_type": "Barangay Clearance"
        }
        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_field_official_cannot_create_walkin_document_request(self):
        barangay = Barangay.objects.create(name="Field Official Test Barangay")
        field_official = User.objects.create_user(
            username="field_official_document_test",
            password="SecurePassword123!",
            email="field-doc-test@example.com",
            role=User.Role.FIELD_OFFICIAL,
            barangay=barangay,
        )
        self.client.force_login(field_official)

        response = self.client.post(
            reverse('document-request-list'),
            {
                "document_type": "Barangay Clearance",
                "walkin_name": "Juan Dela Cruz",
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(DocumentRequest.objects.exists())

    def test_dilg_admin_cannot_create_document_request(self):
        dilg_admin = User.objects.create_user(
            username="dilg_document_test",
            password="SecurePassword123!",
            email="dilg-doc-test@example.com",
            role=User.Role.DILG_ADMIN,
        )
        self.client.force_login(dilg_admin)

        response = self.client.post(
            reverse('document-request-list'),
            {"document_type": "Barangay Clearance"},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(DocumentRequest.objects.exists())

    def test_official_without_barangay_cannot_create_walkin(self):
        self.client.force_login(self.official)

        response = self.client.post(
            reverse('document-request-list'),
            {
                "document_type": "Barangay Clearance",
                "walkin_name": "Juan Dela Cruz",
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(DocumentRequest.objects.exists())

    def test_unverified_resident_cannot_create_document_request(self):
        # Residents who have not yet had their identity/residency verified by the barangay are blocked
        unverified_user = User.objects.create_user(
            username="unverified_resident",
            password="SecurePassword123!",
            email="unverified@example.com",
            role=User.Role.RESIDENT
        )
        Resident.objects.create(
            user=unverified_user,
            full_name="Unverified Resident",
            birth_date="1998-08-20",
            is_verified=False
        )
        self.client.force_login(unverified_user)
        url = reverse('document-request-list')
        payload = {"document_type": "Barangay Clearance"}
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_field_official_cannot_create_queue_ticket(self):
        # Field officials monitor ticker and call next ticket, but cannot take tickets for themselves
        field_official = User.objects.create_user(
            username="tanod_test",
            password="SecurePassword123!",
            email="tanod@example.com",
            role=User.Role.FIELD_OFFICIAL
        )
        self.client.force_login(field_official)
        url = reverse('ticket-list')
        payload = {
            "service_type": "DOCUMENT"
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)   
        
    def test_resident_validated_blocked(self):
        self.client.force_login(self.resident)
        doc_req = DocumentRequest.objects.create(
            user=self.resident,
            document_type="Barangay Clearance",
        )
        url = reverse('document-request-validate', args=[doc_req.id])
        payload = {
            "status": "APPROVED"
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        doc_req.refresh_from_db()
        self.assertEqual(doc_req.status, DocumentRequest.Status.PENDING) 

    def test_official_can_validate_document_request(self):
        # 1. Setup: Log in the admin and create a dummy request
        self.client.force_login(self.official)
        doc_req = DocumentRequest.objects.create(
            user=self.resident,
            document_type="Barangay Clearance",
        )
        
        # 2. Action: Hit the custom /validate/ endpoint
        url = reverse('document-request-validate', args=[doc_req.id])
        payload = {
            'status': 'PROCESSING',
            'admin_notes': 'Document is now being processed'
        }
        response = self.client.patch(url, payload, format="json")
        
        # 3. Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the database actually updated
        doc_req.refresh_from_db()
        self.assertEqual(doc_req.status, DocumentRequest.Status.PROCESSING)
        
        # Verify the audit log was fired
        self.assertEqual(AuditLog.objects.filter(action_type=AuditLog.ActionType.DOCUMENT_ACTION).count(), 1)
      

    def test_resident_cannot_self_assign_priority_on_queue_ticket(self):
        barangay = Barangay.objects.create(name="Resident Priority Claim Barangay")
        self.resident.barangay = barangay
        self.resident.save(update_fields=["barangay"])
        self.client.force_login(self.resident)

        response = self.client.post(
            reverse("ticket-list"),
            {"service_type": "DOCUMENT", "is_priority": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(QueueTicket.objects.count(), 0)
        self.assertFalse(
            AuditLog.objects.filter(
                action_type=AuditLog.ActionType.QUEUE_ACTION
            ).exists()
        )

    def test_admin_priority_ticket_creation_requires_reason_and_is_audited(self):
        barangay = Barangay.objects.create(name="Admin Priority Creation Barangay")
        self.official.barangay = barangay
        self.official.save(update_fields=["barangay"])
        self.client.force_login(self.official)
        url = reverse("ticket-list")
        payload = {
            "walkin_name": "Priority Walk-in",
            "service_type": "DOCUMENT",
            "priority_status": QueueTicket.Priority.PRIORITY,
            "is_priority": True,
        }

        missing_reason_response = self.client.post(url, payload, format="json")
        self.assertEqual(missing_reason_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(QueueTicket.objects.count(), 0)

        payload["priority_reason"] = "Eligibility checked at the service desk"
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ticket = QueueTicket.objects.get()
        self.assertTrue(ticket.is_priority)
        self.assertEqual(ticket.priority_status, QueueTicket.Priority.PRIORITY)
        self.assertFalse(response.data.get("priority_reason"))
        audit_log = AuditLog.objects.get(
            action_type=AuditLog.ActionType.QUEUE_ACTION,
            action_by=self.official,
        )
        self.assertIn("Eligibility checked at the service desk", audit_log.description)
        self.assertIn(ticket.ticket_number, audit_log.description)
        self.assertIn(barangay.name, audit_log.description)

    def test_admin_can_change_waiting_ticket_priority_with_audit_reason(self):
        barangay = Barangay.objects.create(name="Queue Priority Update Barangay")
        self.official.barangay = barangay
        self.official.save(update_fields=["barangay"])
        self.client.force_login(self.official)
        ticket = QueueTicket.objects.create(
            barangay=barangay,
            ticket_number="T014",
            service_type="DOCUMENT",
        )
        url = reverse("ticket-set-priority", args=[ticket.pk])

        response = self.client.post(
            url,
            {
                "priority_status": QueueTicket.Priority.PRIORITY,
                "reason": "Eligibility document checked at the desk",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertTrue(ticket.is_priority)
        self.assertEqual(ticket.priority_status, QueueTicket.Priority.PRIORITY)
        audit_log = AuditLog.objects.get(
            action_type=AuditLog.ActionType.QUEUE_ACTION,
            action_by=self.official,
        )
        self.assertIn("regular to priority", audit_log.description)
        self.assertIn(barangay.name, audit_log.description)
        self.assertIn("Eligibility document checked at the desk", audit_log.description)

        response = self.client.post(
            url,
            {
                "priority_status": QueueTicket.Priority.REGULAR,
                "reason": "Priority eligibility was not confirmed",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertFalse(ticket.is_priority)
        self.assertEqual(ticket.priority_status, QueueTicket.Priority.REGULAR)
        self.assertEqual(
            AuditLog.objects.filter(
                action_type=AuditLog.ActionType.QUEUE_ACTION,
                action_by=self.official,
            ).count(),
            2,
        )

    def test_field_official_cannot_change_ticket_priority(self):
        barangay = Barangay.objects.create(name="Field Official Priority Barangay")
        field_official = User.objects.create_user(
            username="priority_field_official",
            password="SecurePassword123!",
            email="priority-field@example.com",
            role=User.Role.FIELD_OFFICIAL,
            barangay=barangay,
        )
        ticket = QueueTicket.objects.create(
            barangay=barangay,
            ticket_number="T015",
            service_type="DOCUMENT",
        )
        self.client.force_login(field_official)

        response = self.client.post(
            reverse("ticket-set-priority", args=[ticket.pk]),
            {
                "priority_status": QueueTicket.Priority.PRIORITY,
                "reason": "Eligibility document checked at the desk",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        ticket.refresh_from_db()
        self.assertFalse(ticket.is_priority)
        self.assertEqual(ticket.priority_status, QueueTicket.Priority.REGULAR)
        self.assertFalse(
            AuditLog.objects.filter(
                action_type=AuditLog.ActionType.QUEUE_ACTION
            ).exists()
        )

    def test_ticket_priority_cannot_be_changed_through_generic_update(self):
        barangay = Barangay.objects.create(name="Generic Priority Update Barangay")
        self.official.barangay = barangay
        self.official.save(update_fields=["barangay"])
        self.client.force_login(self.official)
        ticket = QueueTicket.objects.create(
            barangay=barangay,
            ticket_number="T016",
            service_type="DOCUMENT",
        )

        response = self.client.patch(
            reverse("ticket-detail", args=[ticket.pk]),
            {
                "is_priority": True,
                "priority_status": QueueTicket.Priority.PRIORITY,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        ticket.refresh_from_db()
        self.assertFalse(ticket.is_priority)
        self.assertEqual(ticket.priority_status, QueueTicket.Priority.REGULAR)

    def test_priority_cannot_be_changed_after_ticket_starts_serving(self):
        barangay = Barangay.objects.create(name="Serving Priority Update Barangay")
        self.official.barangay = barangay
        self.official.save(update_fields=["barangay"])
        self.client.force_login(self.official)
        ticket = QueueTicket.objects.create(
            barangay=barangay,
            ticket_number="T017",
            service_type="DOCUMENT",
            status=QueueTicket.Status.SERVING,
        )

        response = self.client.post(
            reverse("ticket-set-priority", args=[ticket.pk]),
            {
                "priority_status": QueueTicket.Priority.PRIORITY,
                "reason": "Eligibility document checked at the desk",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        ticket.refresh_from_db()
        self.assertFalse(ticket.is_priority)
        self.assertFalse(
            AuditLog.objects.filter(
                action_type=AuditLog.ActionType.QUEUE_ACTION
            ).exists()
        )

    def test_resident_can_create_queue_ticket(self):
        barangay = Barangay.objects.create(name="Resident Queue Creation Barangay")
        self.resident.barangay = barangay
        self.resident.save(update_fields=["barangay"])
        self.client.force_login(self.resident)
        url = reverse('ticket-list')
        payload = {
            "service_type": "DOCUMENT",
            "is_priority": False,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(QueueTicket.objects.count(), 1)
        ticket = QueueTicket.objects.first()
        self.assertEqual(ticket.ticket_number, 'T001')
        self.assertFalse(ticket.is_priority)
        self.assertEqual(ticket.priority_status, QueueTicket.Priority.REGULAR)

    def test_resident_without_barangay_cannot_create_queue_ticket(self):
        self.client.force_login(self.resident)
        response = self.client.post(
            reverse("ticket-list"),
            {"service_type": "DOCUMENT"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(QueueTicket.objects.count(), 0)
        
    def test_resident_cannot_advance_queue(self):
        self.client.force_login(self.resident)
        url = reverse('ticket-next-ticket')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_official_without_barangay_cannot_advance_queue(self):
        ticket = QueueTicket.objects.create(
            ticket_number="T099",
            service_type="DOCUMENT",
            status=QueueTicket.Status.WAITING,
        )
        self.client.force_login(self.official)

        response = self.client.post(reverse("ticket-next-ticket"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.WAITING)

    def test_official_can_advance(self):
        barangay = Barangay.objects.create(name="Official Queue Test Barangay")
        self.official.barangay = barangay
        self.official.save(update_fields=["barangay"])
        self.client.force_login(self.official)

        previous_ticket = QueueTicket.objects.create(
            barangay=barangay,
            status=QueueTicket.Status.SERVING,
            ticket_number="T000",
            service_type="DOCUMENT",
        )
        ticket = QueueTicket.objects.create(
            barangay=barangay,
            status="WAITING",
            ticket_number="T001",
            service_type="DOCUMENT",
        )
        response = self.client.post(reverse("ticket-next-ticket"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        previous_ticket.refresh_from_db()
        self.assertEqual(previous_ticket.status, QueueTicket.Status.COMPLETED)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, "SERVING")
        self.assertEqual(
            AuditLog.objects.filter(
                action_type=AuditLog.ActionType.QUEUE_ACTION
            ).count(),
            1,
        )

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

    def test_official_can_delete_released_document_request(self):
        self.client.force_login(self.official)
        doc = DocumentRequest.objects.create(
            user=self.resident,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.RELEASED
        )
        url = reverse('document-request-detail', args=[doc.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(DocumentRequest.objects.filter(id=doc.id).exists())
        self.assertTrue(AuditLog.objects.filter(action_type=AuditLog.ActionType.DOCUMENT_ACTION, action_by=self.official).exists())

    def test_official_can_delete_rejected_document_request(self):
        self.client.force_login(self.official)
        doc = DocumentRequest.objects.create(
            user=self.resident,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.REJECTED
        )
        url = reverse('document-request-detail', args=[doc.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(DocumentRequest.objects.filter(id=doc.id).exists())

    def test_official_cannot_delete_pending_document_request(self):
        self.client.force_login(self.official)
        doc = DocumentRequest.objects.create(
            user=self.resident,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.PENDING
        )
        url = reverse('document-request-detail', args=[doc.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(DocumentRequest.objects.filter(id=doc.id).exists())

    def test_resident_can_cancel_pending_document_request(self):
        self.client.force_login(self.resident)
        doc = DocumentRequest.objects.create(
            user=self.resident,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.PENDING
        )
        url = reverse('document-request-detail', args=[doc.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(DocumentRequest.objects.filter(id=doc.id).exists())
        self.assertTrue(
            AuditLog.objects.filter(
                action_type=AuditLog.ActionType.DOCUMENT_ACTION,
                action_by=self.resident
            ).exists()
        )

    def test_resident_cannot_delete_released_document_request(self):
        self.client.force_login(self.resident)
        doc = DocumentRequest.objects.create(
            user=self.resident,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.RELEASED
        )
        url = reverse('document-request-detail', args=[doc.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('detail'), "You can only cancel document requests that are still pending review.")
        self.assertTrue(DocumentRequest.objects.filter(id=doc.id).exists())

    def test_resident_cannot_cancel_other_resident_pending_request(self):
        other_resident = User.objects.create_user(
            username="other_resident",
            password="SecurePassword123!",
            email="other@example.com",
            role=User.Role.RESIDENT
        )
        doc = DocumentRequest.objects.create(
            user=other_resident,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.PENDING
        )
        self.client.force_login(self.resident)
        url = reverse('document-request-detail', args=[doc.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(DocumentRequest.objects.filter(id=doc.id).exists())
    
    def test_queue_ticket_sequencing_isolated_by_barangay(self):
        barangay_a = Barangay.objects.create(name="Barangay A")
        barangay_b = Barangay.objects.create(name="Barangay B")

        # First ticket in Barangay A should start at T001
        ticket_a1 = QueueTicket.objects.create(barangay=barangay_a, service_type="Clearance")
        self.assertEqual(ticket_a1.ticket_number, "T001")

        # First ticket in Barangay B should also start at T001 independently
        ticket_b1 = QueueTicket.objects.create(barangay=barangay_b, service_type="Clearance")
        self.assertEqual(ticket_b1.ticket_number, "T001")

        # Second ticket in Barangay A increments to T002
        ticket_a2 = QueueTicket.objects.create(barangay=barangay_a, service_type="Clearance")
        self.assertEqual(ticket_a2.ticket_number, "T002")

    def test_queue_ticket_sequence_resets_at_manila_midnight(self):
        barangay = Barangay.objects.create(name="Manila Midnight Test Barangay")

        with patch("gridy_services.models.timezone.now") as mocked_now:
            mocked_now.return_value = datetime(
                2026, 1, 1, 15, 59, tzinfo=datetime_timezone.utc
            )
            before_midnight = QueueTicket.objects.create(
                barangay=barangay,
                service_type="Clearance",
            )

            mocked_now.return_value = datetime(
                2026, 1, 1, 16, 0, tzinfo=datetime_timezone.utc
            )
            after_midnight = QueueTicket.objects.create(
                barangay=barangay,
                service_type="Clearance",
            )

        self.assertEqual(before_midnight.ticket_number, "T001")
        self.assertEqual(after_midnight.ticket_number, "T001")

    def test_resident_can_cancel_own_waiting_queue_ticket(self):
        barangay = Barangay.objects.create(name="Resident Queue Cancel Test Barangay")
        self.resident.barangay = barangay
        self.resident.save(update_fields=["barangay"])
        self.client.force_login(self.resident)
        ticket = QueueTicket.objects.create(
            user=self.resident,
            barangay=self.resident.barangay,
            service_type="Clearance",
            status=QueueTicket.Status.WAITING
        )
        url = reverse('ticket-cancel-ticket', args=[ticket.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.CANCELLED)
        self.assertTrue(
            AuditLog.objects.filter(
                action_type=AuditLog.ActionType.QUEUE_ACTION,
                action_by=self.resident
            ).exists()
        )

    def test_resident_without_barangay_cannot_cancel_queue_ticket(self):
        ticket = QueueTicket.objects.create(
            user=self.resident,
            ticket_number="T098",
            service_type="DOCUMENT",
            status=QueueTicket.Status.WAITING,
        )
        self.client.force_login(self.resident)

        response = self.client.post(
            reverse("ticket-cancel-ticket", args=[ticket.id])
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.WAITING)

    def test_resident_cannot_cancel_serving_or_completed_queue_ticket(self):
        barangay = Barangay.objects.create(name="Resident Serving Queue Test Barangay")
        self.resident.barangay = barangay
        self.resident.save(update_fields=["barangay"])
        self.client.force_login(self.resident)
        ticket = QueueTicket.objects.create(
            user=self.resident,
            barangay=self.resident.barangay,
            service_type="Clearance",
            status=QueueTicket.Status.SERVING
        )
        url = reverse('ticket-cancel-ticket', args=[ticket.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.SERVING)

    def test_resident_cannot_cancel_other_resident_queue_ticket(self):
        barangay = Barangay.objects.create(name="Other Resident Queue Test Barangay")
        self.resident.barangay = barangay
        self.resident.save(update_fields=["barangay"])
        other_resident = User.objects.create_user(
            username="other_queue_resident",
            password="SecurePassword123!",
            email="other_queue@example.com",
            role=User.Role.RESIDENT,
            barangay=barangay,
        )
        ticket = QueueTicket.objects.create(
            user=other_resident,
            barangay=barangay,
            service_type="Clearance",
            status=QueueTicket.Status.WAITING
        )
        self.client.force_login(self.resident)
        url = reverse('ticket-cancel-ticket', args=[ticket.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.WAITING)

    def test_dilg_admin_cannot_cancel_queue_ticket(self):
        barangay = Barangay.objects.create(
            name="DILG Queue Isolation Test Barangay"
        )
        ticket = QueueTicket.objects.create(
            barangay=barangay,
            service_type="Clearance",
            status=QueueTicket.Status.WAITING,
        )
        dilg_admin = User.objects.create_user(
            username="dilg_queue_test",
            password="SecurePassword123!",
            email="dilg-queue-test@example.com",
            role=User.Role.DILG_ADMIN,
        )

        self.client.force_login(dilg_admin)
        response = self.client.post(
            reverse("ticket-cancel-ticket", args=[ticket.id])
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, QueueTicket.Status.WAITING)

    def test_exempt_resident_document_types_are_zero_fee(self):
        self.client.force_login(self.resident)
        url = reverse("document-request-list")

        for document_type in (
            "Certificate of Indigency",
            "First Time Job Seeker Certificate",
        ):
            with self.subTest(document_type=document_type):
                response = self.client.post(
                    url,
                    {
                        "document_type": document_type,
                        "fee_amount": "99.00",
                    },
                    format="json",
                )

                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                created_request = DocumentRequest.objects.get(pk=response.data["id"])
                self.assertEqual(str(created_request.fee_amount), "0.00")

    def test_exempt_walkin_document_type_is_zero_fee(self):
        barangay = Barangay.objects.create(name="Exempt Fee Test Barangay")
        self.official.barangay = barangay
        self.official.save(update_fields=["barangay"])
        self.client.force_login(self.official)
        url = reverse("document-request-list")

        response = self.client.post(
            url,
            {
                "document_type": "First Time Job Seeker Certificate",
                "walkin_name": "Juan Dela Cruz",
                "fee_amount": "75.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_request = DocumentRequest.objects.get(pk=response.data["id"])
        self.assertEqual(str(created_request.fee_amount), "0.00")
        self.assertEqual(created_request.status, DocumentRequest.Status.PENDING)

    def test_staff_validation_cannot_add_fee_to_exempt_document(self):
        document_request = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.official.barangay,
            document_type="Certificate of Indigency",
            fee_amount="25.00",
        )
        self.client.force_login(self.official)
        url = reverse("document-request-validate", args=[document_request.pk])

        response = self.client.patch(
            url,
            {
                "status": DocumentRequest.Status.PROCESSING,
                "fee_amount": "100.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        document_request.refresh_from_db()
        self.assertEqual(str(document_request.fee_amount), "0.00")

class QueueConcurrencyTests(TransactionTestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(
            name="Queue Concurrency Test Barangay"
        )
        self.official = User.objects.create_user(
            username="queue_concurrency_official",
            password="SecurePassword123!",
            email="queue-concurrency@example.com",
            role=User.Role.ADMIN,
            barangay=self.barangay,
        )

    @skipUnlessDBFeature("has_select_for_update")
    def test_concurrent_ticket_creation_assigns_distinct_numbers(self):
        barrier = Barrier(2)
        barangay_id = self.barangay.pk

        def create_ticket(_):
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                ticket = QueueTicket.objects.create(
                    barangay_id=barangay_id,
                    service_type="DOCUMENT",
                )
                return ticket.ticket_number
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=2) as executor:
            ticket_numbers = list(executor.map(create_ticket, range(2)))

        self.assertCountEqual(ticket_numbers, ["T001", "T002"])

    @skipUnlessDBFeature("has_select_for_update")
    def test_concurrent_advances_serve_different_waiting_tickets(self):
        first_ticket = QueueTicket.objects.create(
            barangay=self.barangay,
            ticket_number="T001",
            service_type="DOCUMENT",
            status=QueueTicket.Status.WAITING,
        )
        second_ticket = QueueTicket.objects.create(
            barangay=self.barangay,
            ticket_number="T002",
            service_type="DOCUMENT",
            status=QueueTicket.Status.WAITING,
        )

        barrier = Barrier(2)
        official_id = self.official.pk
        view = QueueTicketViewSet.as_view({"post": "next_ticket"})

        def advance_queue(_):
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                official = User.objects.get(pk=official_id)
                request = APIRequestFactory().post("/api/v1/tickets/next/")
                force_authenticate(request, user=official)
                response = view(request)
                return response.status_code, response.data.get("current_ticket")
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(advance_queue, range(2)))

        self.assertEqual(
            [response_status for response_status, _ in results],
            [status.HTTP_200_OK, status.HTTP_200_OK],
        )
        self.assertCountEqual(
            [ticket_number for _, ticket_number in results],
            ["T001", "T002"],
        )

        first_ticket.refresh_from_db()
        second_ticket.refresh_from_db()
        self.assertEqual(first_ticket.status, QueueTicket.Status.COMPLETED)
        self.assertEqual(second_ticket.status, QueueTicket.Status.SERVING)

class DocumentPaymentWorkflowTests(APITestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(name="Payment Workflow Barangay")
        self.resident = User.objects.create_user(
            username="payment_resident",
            password="SecurePassword123!",
            email="payment-resident@example.com",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        Resident.objects.create(
            user=self.resident,
            full_name="Payment Resident",
            birth_date="1990-01-01",
            is_verified=True,
        )
        self.official = User.objects.create_user(
            username="payment_official",
            password="SecurePassword123!",
            email="payment-official@example.com",
            role=User.Role.ADMIN,
            barangay=self.barangay,
        )

    def make_request(self, **overrides):
        values = {
            "user": self.resident,
            "barangay": self.barangay,
            "document_type": "Barangay Clearance",
            "purpose": "Employment",
            "status": DocumentRequest.Status.READY_FOR_PICKUP,
            "fee_amount": "50.00",
            "payment_status": DocumentRequest.PaymentStatus.UNPAID,
        }
        values.update(overrides)
        return DocumentRequest.objects.create(**values)

    def test_existing_official_receipts_backfill_as_verified_cash(self):
        paid_document = self.make_request(or_number="OR-LEGACY-100")
        unpaid_document = self.make_request(or_number="")
        migration = import_module(
            "gridy_services.migrations.0011_document_payment_review"
        )

        migration.initialize_existing_payment_status(
            apps,
            SimpleNamespace(connection=connection),
        )

        paid_document.refresh_from_db()
        unpaid_document.refresh_from_db()
        self.assertEqual(paid_document.payment_method, DocumentRequest.PaymentMethod.CASH)
        self.assertEqual(
            paid_document.payment_status,
            DocumentRequest.PaymentStatus.VERIFIED,
        )
        self.assertEqual(
            unpaid_document.payment_status,
            DocumentRequest.PaymentStatus.UNPAID,
        )

    def test_resident_can_submit_gcash_reference_for_own_ready_request(self):
        document = self.make_request()
        self.client.force_login(self.resident)

        response = self.client.post(
            reverse("document-request-payment-reference", args=[document.pk]),
            {"payment_reference": " GCASH-REF-2048 "},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        document.refresh_from_db()
        self.assertEqual(document.payment_method, DocumentRequest.PaymentMethod.GCASH)
        self.assertEqual(document.payment_reference, "GCASH-REF-2048")
        self.assertEqual(
            document.payment_status,
            DocumentRequest.PaymentStatus.PENDING_VERIFICATION,
        )

    def test_resident_cannot_submit_gcash_reference_for_another_resident(self):
        document = self.make_request()
        other_resident = User.objects.create_user(
            username="other_payment_resident",
            password="SecurePassword123!",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        self.client.force_login(other_resident)

        response = self.client.post(
            reverse("document-request-payment-reference", args=[document.pk]),
            {"payment_reference": "GCASH-REF-2048"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        document.refresh_from_db()
        self.assertFalse(document.payment_reference)

    def test_gcash_reference_requires_a_ready_paid_request(self):
        document = self.make_request(status=DocumentRequest.Status.PROCESSING)
        self.client.force_login(self.resident)

        response = self.client.post(
            reverse("document-request-payment-reference", args=[document.pk]),
            {"payment_reference": "GCASH-REF-2048"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_gcash_review_requires_a_reason_when_rejected(self):
        document = self.make_request(
            payment_method=DocumentRequest.PaymentMethod.GCASH,
            payment_reference="GCASH-REF-2048",
            payment_status=DocumentRequest.PaymentStatus.PENDING_VERIFICATION,
        )
        self.client.force_login(self.official)

        response = self.client.patch(
            reverse("document-request-payment-review", args=[document.pk]),
            {"status": DocumentRequest.PaymentStatus.REJECTED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        document.refresh_from_db()
        self.assertEqual(
            document.payment_status,
            DocumentRequest.PaymentStatus.PENDING_VERIFICATION,
        )

    def test_official_can_verify_gcash_reference_and_audit_it(self):
        document = self.make_request(
            payment_method=DocumentRequest.PaymentMethod.GCASH,
            payment_reference="GCASH-REF-2048",
            payment_status=DocumentRequest.PaymentStatus.PENDING_VERIFICATION,
        )
        self.client.force_login(self.official)

        response = self.client.patch(
            reverse("document-request-payment-review", args=[document.pk]),
            {"status": DocumentRequest.PaymentStatus.VERIFIED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        document.refresh_from_db()
        self.assertEqual(
            document.payment_status,
            DocumentRequest.PaymentStatus.VERIFIED,
        )
        self.assertTrue(
            AuditLog.objects.filter(
                action_by=self.official,
                action_type=AuditLog.ActionType.DOCUMENT_ACTION,
                description__icontains=f"#{document.pk}",
            ).exists()
        )

    def test_official_from_another_barangay_cannot_review_gcash_reference(self):
        document = self.make_request(
            payment_method=DocumentRequest.PaymentMethod.GCASH,
            payment_reference="GCASH-REF-2048",
            payment_status=DocumentRequest.PaymentStatus.PENDING_VERIFICATION,
        )
        other_barangay = Barangay.objects.create(name="Other Payment Barangay")
        other_official = User.objects.create_user(
            username="other_payment_official",
            password="SecurePassword123!",
            role=User.Role.ADMIN,
            barangay=other_barangay,
        )
        self.client.force_login(other_official)

        response = self.client.patch(
            reverse("document-request-payment-review", args=[document.pk]),
            {"status": DocumentRequest.PaymentStatus.VERIFIED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        document.refresh_from_db()
        self.assertEqual(
            document.payment_status,
            DocumentRequest.PaymentStatus.PENDING_VERIFICATION,
        )

    def test_paid_document_cannot_be_released_before_payment_verification(self):
        document = self.make_request(
            payment_method=DocumentRequest.PaymentMethod.GCASH,
            payment_reference="GCASH-REF-2048",
            payment_status=DocumentRequest.PaymentStatus.PENDING_VERIFICATION,
        )
        self.client.force_login(self.official)

        response = self.client.patch(
            reverse("document-request-validate", args=[document.pk]),
            {
                "status": DocumentRequest.Status.RELEASED,
                "or_number": "OR-1001",
                "payment_method": DocumentRequest.PaymentMethod.GCASH,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        document.refresh_from_db()
        self.assertEqual(document.status, DocumentRequest.Status.READY_FOR_PICKUP)

    def test_cash_can_be_recorded_at_release_with_official_receipt(self):
        document = self.make_request()
        self.client.force_login(self.official)

        response = self.client.patch(
            reverse("document-request-validate", args=[document.pk]),
            {
                "status": DocumentRequest.Status.RELEASED,
                "or_number": "OR-1002",
                "payment_method": DocumentRequest.PaymentMethod.CASH,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        document.refresh_from_db()
        self.assertEqual(document.status, DocumentRequest.Status.RELEASED)
        self.assertEqual(
            document.payment_status,
            DocumentRequest.PaymentStatus.VERIFIED,
        )

    def test_exempt_document_release_does_not_require_payment(self):
        document = self.make_request(
            document_type="Certificate of Indigency",
            fee_amount="0.00",
            payment_status=DocumentRequest.PaymentStatus.NOT_REQUIRED,
        )
        self.client.force_login(self.official)

        response = self.client.patch(
            reverse("document-request-validate", args=[document.pk]),
            {"status": DocumentRequest.Status.RELEASED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        document.refresh_from_db()
        self.assertEqual(
            document.payment_status,
            DocumentRequest.PaymentStatus.NOT_REQUIRED,
        )


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
        
class SystemHealthAPITests(APITestCase):
    def test_health_check_endpoint_success(self):
        url = reverse('health_check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "healthy")
        self.assertIn("database", response.data["services"])
        self.assertIn("cache", response.data["services"])
        self.assertEqual(response.data["services"]["database"]["status"], "healthy")
        self.assertEqual(response.data["services"]["cache"]["status"], "healthy")

    @override_settings(
        CORS_ALLOWED_ORIGINS=["https://app.example.gov.ph"],
        CORS_ALLOW_CREDENTIALS=True,
    )
    def test_preflight_allows_configured_origin_with_credentials(self):
        origin = "https://app.example.gov.ph"
        response = self.client.options(
            reverse("health_check"),
            HTTP_ORIGIN=origin,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Access-Control-Allow-Origin"], origin)
        self.assertEqual(
            response["Access-Control-Allow-Credentials"],
            "true",
        )

    @override_settings(
        CORS_ALLOWED_ORIGINS=["https://app.example.gov.ph"],
        CORS_ALLOW_CREDENTIALS=True,
    )
    def test_preflight_omits_cors_headers_for_unlisted_origin(self):
        response = self.client.options(
            reverse("health_check"),
            HTTP_ORIGIN="https://unlisted.example.net",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        )

        self.assertNotIn("Access-Control-Allow-Origin", response)
        self.assertNotIn("Access-Control-Allow-Credentials", response)
