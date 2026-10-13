from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from gridy_auth.models import User, Barangay, Resident
from gridy_services.models import DocumentRequest
from gridy_audit.models import AuditLog


class FeeAssessmentWorkflowAndRBACTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.barangay = Barangay.objects.create(name="Barangay Assessment City")
        self.other_barangay = Barangay.objects.create(name="Foreign Assessment City")

        self.resident = User.objects.create_user(
            username="assessment_resident",
            email="resident@assessment.test",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        Resident.objects.create(
            user=self.resident,
            full_name="Assessment Resident",
            birth_date="1995-05-15",
            is_verified=True,
        )
        self.other_resident = User.objects.create_user(
            username="other_resident",
            email="other@assessment.test",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        Resident.objects.create(
            user=self.other_resident,
            full_name="Other Resident",
            birth_date="1992-02-12",
            is_verified=True,
        )
        self.admin = User.objects.create_user(
            username="barangay_admin",
            email="admin@assessment.test",
            role=User.Role.ADMIN,
            barangay=self.barangay,
        )
        self.field_official = User.objects.create_user(
            username="field_official",
            email="official@assessment.test",
            role=User.Role.FIELD_OFFICIAL,
            barangay=self.barangay,
        )
        self.foreign_admin = User.objects.create_user(
            username="foreign_admin",
            email="foreign@assessment.test",
            role=User.Role.ADMIN,
            barangay=self.other_barangay,
        )
        self.unassigned_official = User.objects.create_user(
            username="unassigned_official",
            email="unassigned@assessment.test",
            role=User.Role.FIELD_OFFICIAL,
            barangay=None,
        )

    def test_ordinary_request_creation_defaults_to_awaiting_assessment(self):
        self.client.force_login(self.resident)
        response = self.client.post(
            reverse("document-request-list"),
            {
                "document_type": "Barangay Clearance",
                "purpose": "Employment",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        doc = DocumentRequest.objects.get(pk=response.data["id"])
        self.assertEqual(
            doc.fee_assessment_status,
            DocumentRequest.FeeAssessmentStatus.AWAITING_ASSESSMENT,
        )
        self.assertEqual(doc.fee_amount, Decimal("0.00"))
        self.assertEqual(doc.payment_status, DocumentRequest.PaymentStatus.NOT_REQUIRED)
        self.assertIsNone(doc.fee_assessed_by)
        self.assertIsNone(doc.fee_assessed_at)
        self.assertEqual(doc.fee_waiver_reason, "")

    def test_statutory_exempt_creation_defaults_to_statutory_exempt(self):
        self.client.force_login(self.resident)
        response = self.client.post(
            reverse("document-request-list"),
            {
                "document_type": "Certificate of Indigency",
                "purpose": "Scholarship",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        doc = DocumentRequest.objects.get(pk=response.data["id"])
        self.assertEqual(
            doc.fee_assessment_status,
            DocumentRequest.FeeAssessmentStatus.STATUTORY_EXEMPT,
        )
        self.assertEqual(doc.fee_amount, Decimal("0.00"))
        self.assertEqual(doc.payment_status, DocumentRequest.PaymentStatus.NOT_REQUIRED)
        self.assertIsNone(doc.fee_assessed_by)
        self.assertIsNotNone(doc.fee_assessed_at)

    def test_staff_cannot_mark_ready_for_pickup_while_awaiting_assessment(self):
        doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            purpose="Employment",
            status=DocumentRequest.Status.PROCESSING,
            fee_amount=Decimal("0.00"),
            fee_assessment_status=DocumentRequest.FeeAssessmentStatus.AWAITING_ASSESSMENT,
        )
        self.client.force_login(self.admin)
        response = self.client.patch(
            reverse("document-request-validate", args=[doc.pk]),
            {"status": DocumentRequest.Status.READY_FOR_PICKUP},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("fee_assessment_status", response.data)
        doc.refresh_from_db()
        self.assertEqual(doc.status, DocumentRequest.Status.PROCESSING)

    def test_staff_assessing_positive_fee_sets_provenance_and_unpaid(self):
        doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            purpose="Employment",
            status=DocumentRequest.Status.PROCESSING,
            fee_amount=Decimal("0.00"),
            fee_assessment_status=DocumentRequest.FeeAssessmentStatus.AWAITING_ASSESSMENT,
        )
        self.client.force_login(self.field_official)
        response = self.client.patch(
            reverse("document-request-validate", args=[doc.pk]),
            {
                "fee_amount": 65.00,
                "status": DocumentRequest.Status.READY_FOR_PICKUP,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        doc.refresh_from_db()
        self.assertEqual(
            doc.fee_assessment_status, DocumentRequest.FeeAssessmentStatus.ASSESSED
        )
        self.assertEqual(doc.fee_amount, Decimal("65.00"))
        self.assertEqual(doc.fee_assessed_by, self.field_official)
        self.assertIsNotNone(doc.fee_assessed_at)
        self.assertEqual(doc.fee_waiver_reason, "")
        self.assertEqual(doc.payment_status, DocumentRequest.PaymentStatus.UNPAID)
        self.assertEqual(doc.status, DocumentRequest.Status.READY_FOR_PICKUP)

        # Confirm AuditLog
        log_entry = AuditLog.objects.filter(
            action_type=AuditLog.ActionType.DOCUMENT_ACTION,
            action_by=self.field_official,
        ).first()
        self.assertIsNotNone(log_entry)
        self.assertIn("Assessed fee of ₱65.00", log_entry.description)

    def test_staff_waiving_fee_requires_justification(self):
        doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            purpose="Employment",
            status=DocumentRequest.Status.PROCESSING,
            fee_amount=Decimal("0.00"),
            fee_assessment_status=DocumentRequest.FeeAssessmentStatus.AWAITING_ASSESSMENT,
        )
        self.client.force_login(self.admin)

        # Attempt to waive with 0 fee but empty reason
        res_empty = self.client.patch(
            reverse("document-request-validate", args=[doc.pk]),
            {
                "fee_amount": 0,
                "fee_waiver_reason": "   ",
                "status": DocumentRequest.Status.READY_FOR_PICKUP,
            },
            format="json",
        )
        self.assertEqual(res_empty.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("fee_waiver_reason", res_empty.data)

        # Attempt with valid justification
        res_valid = self.client.patch(
            reverse("document-request-validate", args=[doc.pk]),
            {
                "fee_amount": 0,
                "fee_waiver_reason": "Resident presented approved financial assistance referral.",
                "status": DocumentRequest.Status.READY_FOR_PICKUP,
            },
            format="json",
        )
        self.assertEqual(res_valid.status_code, status.HTTP_200_OK)
        doc.refresh_from_db()
        self.assertEqual(
            doc.fee_assessment_status, DocumentRequest.FeeAssessmentStatus.WAIVED
        )
        self.assertEqual(doc.fee_amount, Decimal("0.00"))
        self.assertEqual(doc.fee_assessed_by, self.admin)
        self.assertEqual(
            doc.fee_waiver_reason,
            "Resident presented approved financial assistance referral.",
        )
        self.assertEqual(doc.payment_status, DocumentRequest.PaymentStatus.NOT_REQUIRED)
        self.assertEqual(doc.status, DocumentRequest.Status.READY_FOR_PICKUP)

        # Confirm AuditLog
        log_entry = AuditLog.objects.filter(
            action_type=AuditLog.ActionType.DOCUMENT_ACTION,
            action_by=self.admin,
        ).first()
        self.assertIsNotNone(log_entry)
        self.assertIn("Approved zero-fee waiver", log_entry.description)
        self.assertIn("financial assistance referral", log_entry.description)

    def test_statutory_exempt_request_cannot_have_fee_added(self):
        doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="First Time Job Seeker Certificate",
            purpose="Job Application",
            status=DocumentRequest.Status.PROCESSING,
            fee_amount=Decimal("0.00"),
            fee_assessment_status=DocumentRequest.FeeAssessmentStatus.STATUTORY_EXEMPT,
        )
        self.client.force_login(self.admin)
        response = self.client.patch(
            reverse("document-request-validate", args=[doc.pk]),
            {"fee_amount": 50.00},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        doc.refresh_from_db()
        self.assertEqual(doc.fee_amount, Decimal("0.00"))
        self.assertEqual(
            doc.fee_assessment_status,
            DocumentRequest.FeeAssessmentStatus.STATUTORY_EXEMPT,
        )

    def test_cross_barangay_and_unassigned_staff_cannot_validate(self):
        doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            purpose="Employment",
            status=DocumentRequest.Status.PROCESSING,
            fee_amount=Decimal("0.00"),
            fee_assessment_status=DocumentRequest.FeeAssessmentStatus.AWAITING_ASSESSMENT,
        )
        # Foreign Admin
        self.client.force_login(self.foreign_admin)
        res_foreign = self.client.patch(
            reverse("document-request-validate", args=[doc.pk]),
            {"fee_amount": 50.00},
            format="json",
        )
        self.assertEqual(res_foreign.status_code, status.HTTP_404_NOT_FOUND)

        # Unassigned Official
        self.client.force_login(self.unassigned_official)
        res_unassigned = self.client.patch(
            reverse("document-request-validate", args=[doc.pk]),
            {"fee_amount": 50.00},
            format="json",
        )
        self.assertEqual(res_unassigned.status_code, status.HTTP_404_NOT_FOUND)

    def test_resident_cannot_mutate_fee_assessment_fields(self):
        doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            purpose="Employment",
            status=DocumentRequest.Status.PENDING,
            fee_amount=Decimal("0.00"),
            fee_assessment_status=DocumentRequest.FeeAssessmentStatus.AWAITING_ASSESSMENT,
        )
        self.client.force_login(self.resident)
        response = self.client.patch(
            reverse("document-request-detail", args=[doc.pk]),
            {
                "fee_assessment_status": "WAIVED",
                "fee_waiver_reason": "I waived it myself",
                "fee_amount": 0.00,
            },
            format="json",
        )
        # Residents cannot update fields or mutate assessment
        doc.refresh_from_db()
        self.assertEqual(
            doc.fee_assessment_status,
            DocumentRequest.FeeAssessmentStatus.AWAITING_ASSESSMENT,
        )
        self.assertEqual(doc.fee_waiver_reason, "")

    def test_release_gate_allows_waived_document_without_or_number(self):
        doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            purpose="Employment",
            status=DocumentRequest.Status.READY_FOR_PICKUP,
            fee_amount=Decimal("0.00"),
            fee_assessment_status=DocumentRequest.FeeAssessmentStatus.WAIVED,
            fee_assessed_by=self.admin,
            fee_assessed_at=timezone.now(),
            fee_waiver_reason="Emergency shelter assistance exemption",
            payment_status=DocumentRequest.PaymentStatus.NOT_REQUIRED,
        )
        self.client.force_login(self.admin)
        response = self.client.patch(
            reverse("document-request-validate", args=[doc.pk]),
            {"status": DocumentRequest.Status.RELEASED},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        doc.refresh_from_db()
        self.assertEqual(doc.status, DocumentRequest.Status.RELEASED)

    def test_serializer_exposes_fee_assessment_provenance(self):
        doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            purpose="Employment",
            status=DocumentRequest.Status.READY_FOR_PICKUP,
            fee_amount=Decimal("50.00"),
            fee_assessment_status=DocumentRequest.FeeAssessmentStatus.ASSESSED,
            fee_assessed_by=self.field_official,
            fee_assessed_at=timezone.now(),
            payment_status=DocumentRequest.PaymentStatus.UNPAID,
        )
        self.client.force_login(self.resident)
        response = self.client.get(reverse("document-request-detail", args=[doc.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["fee_assessment_status"], "ASSESSED")
        self.assertEqual(
            response.data["fee_assessed_by_name"], self.field_official.get_full_name() or self.field_official.username
        )
        self.assertIsNotNone(response.data["fee_assessed_at"])
        self.assertEqual(response.data["fee_waiver_reason"], "")
