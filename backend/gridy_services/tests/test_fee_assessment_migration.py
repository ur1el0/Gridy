from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from gridy_auth.models import User, Barangay
from gridy_services.models import DocumentRequest
import importlib

migration_0016 = importlib.import_module(
    "gridy_services.migrations.0016_document_fee_assessment_provenance"
)
backfill_fee_assessment_provenance = (
    migration_0016.backfill_fee_assessment_provenance
)
from django.apps import apps


class FeeAssessmentMigrationBackfillTests(TestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(name="Migration Test Barangay")
        self.resident = User.objects.create_user(
            username="migration_resident",
            email="resident@migration.test",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )

    def test_statutory_exempt_requests_backfilled_as_statutory_exempt(self):
        doc1 = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Certificate of Indigency",
            fee_amount=Decimal("0.00"),
            status=DocumentRequest.Status.RELEASED,
        )
        doc2 = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="First Time Job Seeker Certificate",
            fee_amount=Decimal("0.00"),
            status=DocumentRequest.Status.PENDING,
        )

        backfill_fee_assessment_provenance(apps, None)

        doc1.refresh_from_db()
        doc2.refresh_from_db()

        self.assertEqual(
            doc1.fee_assessment_status,
            DocumentRequest.FeeAssessmentStatus.STATUTORY_EXEMPT,
        )
        self.assertIsNone(doc1.fee_assessed_by)
        self.assertEqual(doc1.fee_assessed_at, doc1.created_at)
        self.assertEqual(doc1.fee_waiver_reason, "")

        self.assertEqual(
            doc2.fee_assessment_status,
            DocumentRequest.FeeAssessmentStatus.STATUTORY_EXEMPT,
        )
        self.assertIsNone(doc2.fee_assessed_by)
        self.assertEqual(doc2.fee_assessed_at, doc2.created_at)

    def test_historical_released_positive_fee_request_backfilled_as_assessed_without_invented_staff(self):
        doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            fee_amount=Decimal("50.00"),
            status=DocumentRequest.Status.RELEASED,
            or_number="OR-HIST-001",
        )

        backfill_fee_assessment_provenance(apps, None)

        doc.refresh_from_db()
        self.assertEqual(
            doc.fee_assessment_status,
            DocumentRequest.FeeAssessmentStatus.ASSESSED,
        )
        self.assertIsNone(doc.fee_assessed_by)
        self.assertIsNotNone(doc.fee_assessed_at)
        self.assertEqual(doc.fee_waiver_reason, "")

    def test_historical_released_zero_fee_request_backfilled_as_waived_with_truthful_reason(self):
        doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            fee_amount=Decimal("0.00"),
            status=DocumentRequest.Status.RELEASED,
        )

        backfill_fee_assessment_provenance(apps, None)

        doc.refresh_from_db()
        self.assertEqual(
            doc.fee_assessment_status,
            DocumentRequest.FeeAssessmentStatus.WAIVED,
        )
        self.assertIsNone(doc.fee_assessed_by)
        self.assertIsNotNone(doc.fee_assessed_at)
        self.assertEqual(
            doc.fee_waiver_reason,
            "Legacy clearance released prior to explicit fee assessment tracking.",
        )

    def test_active_zero_fee_requests_backfilled_as_awaiting_assessment(self):
        pending_doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            fee_amount=Decimal("0.00"),
            status=DocumentRequest.Status.PENDING,
        )
        processing_doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            fee_amount=Decimal("0.00"),
            status=DocumentRequest.Status.PROCESSING,
        )
        ready_doc = DocumentRequest.objects.create(
            user=self.resident,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            fee_amount=Decimal("0.00"),
            status=DocumentRequest.Status.READY_FOR_PICKUP,
        )

        backfill_fee_assessment_provenance(apps, None)

        pending_doc.refresh_from_db()
        processing_doc.refresh_from_db()
        ready_doc.refresh_from_db()

        self.assertEqual(pending_doc.status, DocumentRequest.Status.PENDING)
        self.assertEqual(processing_doc.status, DocumentRequest.Status.PROCESSING)
        self.assertEqual(ready_doc.status, DocumentRequest.Status.PROCESSING)

        for d in (pending_doc, processing_doc, ready_doc):
            self.assertEqual(
                d.fee_assessment_status,
                DocumentRequest.FeeAssessmentStatus.AWAITING_ASSESSMENT,
            )
            self.assertIsNone(d.fee_assessed_by)
            self.assertIsNone(d.fee_assessed_at)
            self.assertEqual(d.fee_waiver_reason, "")
