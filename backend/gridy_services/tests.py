from gridy_reports.models import IssueReport
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from gridy_auth.models import User, Resident
from gridy_services.models import DocumentRequest, QueueTicket
from gridy_audit.models import AuditLog
from gridy_auth.models import User, Resident, Barangay

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
        payload =  {
            "document_type": "Barangay Clearance",
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DocumentRequest.objects.count(), 1)   
          
    def test_official_can_create_walkin_document_request(self):
        # Officials can record walk-in clearances by specifying walkin_name
        self.client.force_login(self.official)
        url = reverse('document-request-list')
        payload = {
            "document_type": "Barangay Clearance",
            "walkin_name": "Juan Dela Cruz",
            "walkin_purok": "Purok 3",
            "or_number": "OR-2026-001",
            "fee_amount": "50.00"
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get('is_walkin'))
        self.assertEqual(response.data.get('requester_name'), "Juan Dela Cruz")
        self.assertEqual(response.data.get('or_number'), "OR-2026-001")

    def test_official_creating_walkin_requires_name(self):
        # Walk-in submissions without a resident name are rejected with 400
        self.client.force_login(self.official)
        url = reverse('document-request-list')
        payload = {
            "document_type": "Barangay Clearance"
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
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
      

    def test_resident_can_create_queue_ticket(self):
        self.client.force_login(self.resident)
        url = reverse('ticket-list')
        payload = {
            "service_type": "DOCUMENT"
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(QueueTicket.objects.count(), 1)
        self.assertEqual(QueueTicket.objects.first().ticket_number, 'T001')    
        
    def test_resident_cannot_advance_queue(self):
        self.client.force_login(self.resident)
        url = reverse('ticket-next-ticket')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_official_can_advance(self):
        self.client.force_login(self.official)
        url = reverse('ticket-next-ticket')
        ticket = QueueTicket.objects.create(
            status="WAITING",
            ticket_number="T001",
            service_type="DOCUMENT"
        )
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, "SERVING")

        # Verify that an audit log entry was generated
        self.assertEqual(AuditLog.objects.filter(action_type=AuditLog.ActionType.QUEUE_ACTION).count(),  1)


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

    def test_resident_cannot_delete_document_request(self):
        self.client.force_login(self.resident)
        doc = DocumentRequest.objects.create(
            user=self.resident,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.RELEASED
        )
        url = reverse('document-request-detail', args=[doc.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
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