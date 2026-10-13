import json

from django.urls import reverse
from rest_framework import status

from gridy_audit.models import AuditLog
from gridy_auth.models import Barangay
from gridy_services.models import DocumentRequest

from .base import ServiceAPIBaseTestCase


class DocumentValidationAuditAndTransitionTests(ServiceAPIBaseTestCase):
    def _assign_shared_barangay(self):
        barangay = Barangay.objects.create(name="Validation Audit Barangay")
        self.official.barangay = barangay
        self.official.save(update_fields=["barangay"])
        self.resident.barangay = barangay
        self.resident.save(update_fields=["barangay"])
        return barangay

    def test_validation_audit_records_actor_ip_timestamp_and_before_after_diff(self):
        barangay = self._assign_shared_barangay()
        document = DocumentRequest.objects.create(
            user=self.resident,
            barangay=barangay,
            document_type="Barangay Clearance",
            status=DocumentRequest.Status.PROCESSING,
            fee_amount="0.00",
            fee_assessment_status=DocumentRequest.FeeAssessmentStatus.AWAITING_ASSESSMENT,
            payment_status=DocumentRequest.PaymentStatus.NOT_REQUIRED,
        )
        self.client.force_login(self.official)

        response = self.client.patch(
            reverse("document-request-validate", args=[document.pk]),
            {
                "status": DocumentRequest.Status.READY_FOR_PICKUP,
                "fee_amount": "65.00",
                "or_number": "OR-AUDIT-001",
                "payment_method": DocumentRequest.PaymentMethod.CASH,
            },
            format="json",
            HTTP_X_FORWARDED_FOR="198.51.100.42",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        audit = AuditLog.objects.get(
            action_by=self.official,
            description__contains="Audit changes:",
        )
        self.assertEqual(audit.ip_address, "198.51.100.42")
        self.assertIsNotNone(audit.timestamp)

        changes = json.loads(audit.description.split("Audit changes: ", 1)[1])
        self.assertEqual(
            changes["status"],
            {
                "before": DocumentRequest.Status.PROCESSING,
                "after": DocumentRequest.Status.READY_FOR_PICKUP,
            },
        )
        self.assertEqual(changes["fee_amount"], {"before": "0.00", "after": "65.00"})
        self.assertEqual(
            changes["or_number"], {"before": None, "after": "OR-AUDIT-001"}
        )
        self.assertEqual(
            changes["payment_method"],
            {"before": "", "after": DocumentRequest.PaymentMethod.CASH},
        )

    def test_validation_rejects_skipped_backward_and_terminal_status_transitions(self):
        barangay = self._assign_shared_barangay()
        invalid_transitions = (
            (DocumentRequest.Status.PENDING, DocumentRequest.Status.READY_FOR_PICKUP),
            (DocumentRequest.Status.PROCESSING, DocumentRequest.Status.RELEASED),
            (DocumentRequest.Status.READY_FOR_PICKUP, DocumentRequest.Status.PROCESSING),
            (DocumentRequest.Status.REJECTED, DocumentRequest.Status.PROCESSING),
            (DocumentRequest.Status.RELEASED, DocumentRequest.Status.READY_FOR_PICKUP),
        )
        self.client.force_login(self.official)

        for current_status, requested_status in invalid_transitions:
            with self.subTest(current=current_status, requested=requested_status):
                document = DocumentRequest.objects.create(
                    user=self.resident,
                    barangay=barangay,
                    document_type="Barangay Clearance",
                    status=current_status,
                    fee_assessment_status=DocumentRequest.FeeAssessmentStatus.ASSESSED,
                )

                response = self.client.patch(
                    reverse("document-request-validate", args=[document.pk]),
                    {"status": requested_status},
                    format="json",
                )

                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("status", response.data)
                self.assertIn("transition", str(response.data["status"]).lower())
                document.refresh_from_db()
                self.assertEqual(document.status, current_status)
