from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def backfill_fee_assessment_provenance(apps, schema_editor):
    DocumentRequest = apps.get_model("gridy_services", "DocumentRequest")

    statutory_exempt_types = {
        "certificate of indigency",
        "first time job seeker certificate",
    }

    for doc in DocumentRequest.objects.all():
        doc_type_normalized = " ".join((doc.document_type or "").split()).casefold()

        if doc_type_normalized in statutory_exempt_types:
            doc.fee_assessment_status = "STATUTORY_EXEMPT"
            doc.fee_assessed_at = doc.created_at
            doc.fee_assessed_by = None
            doc.fee_waiver_reason = ""
            doc.save(
                update_fields=[
                    "fee_assessment_status",
                    "fee_assessed_at",
                    "fee_assessed_by",
                    "fee_waiver_reason",
                ]
            )
            continue

        if doc.status == "RELEASED":
            if doc.fee_amount > 0:
                doc.fee_assessment_status = "ASSESSED"
                doc.fee_assessed_at = doc.updated_at
                doc.fee_assessed_by = None
                doc.fee_waiver_reason = ""
            else:
                doc.fee_assessment_status = "WAIVED"
                doc.fee_assessed_at = doc.updated_at
                doc.fee_assessed_by = None
                doc.fee_waiver_reason = (
                    "Legacy clearance released prior to explicit fee assessment tracking."
                )
            doc.save(
                update_fields=[
                    "fee_assessment_status",
                    "fee_assessed_at",
                    "fee_assessed_by",
                    "fee_waiver_reason",
                ]
            )
        elif doc.status == "REJECTED":
            if doc.fee_amount > 0:
                doc.fee_assessment_status = "ASSESSED"
                doc.fee_assessed_at = doc.updated_at
                doc.fee_assessed_by = None
                doc.fee_waiver_reason = ""
            else:
                doc.fee_assessment_status = "AWAITING_ASSESSMENT"
                doc.fee_assessed_at = None
                doc.fee_assessed_by = None
                doc.fee_waiver_reason = ""
            doc.save(
                update_fields=[
                    "fee_assessment_status",
                    "fee_assessed_at",
                    "fee_assessed_by",
                    "fee_waiver_reason",
                ]
            )
        elif doc.status == "READY_FOR_PICKUP" and doc.fee_amount == 0:
            # Zero-fee requests at READY_FOR_PICKUP cannot have reached that state
            # without an explicit fee decision. Revert to PROCESSING so staff must
            # assess or waive the fee before the document can be released.
            doc.status = "PROCESSING"
            doc.fee_assessment_status = "AWAITING_ASSESSMENT"
            doc.fee_assessed_at = None
            doc.fee_assessed_by = None
            doc.fee_waiver_reason = ""
            doc.save(
                update_fields=[
                    "status",
                    "fee_assessment_status",
                    "fee_assessed_at",
                    "fee_assessed_by",
                    "fee_waiver_reason",
                ]
            )
        else:
            if doc.fee_amount > 0:
                doc.fee_assessment_status = "ASSESSED"
                doc.fee_assessed_at = doc.updated_at
                doc.fee_assessed_by = None
                doc.fee_waiver_reason = ""
            else:
                doc.fee_assessment_status = "AWAITING_ASSESSMENT"
                doc.fee_assessed_at = None
                doc.fee_assessed_by = None
                doc.fee_waiver_reason = ""
            doc.save(
                update_fields=[
                    "fee_assessment_status",
                    "fee_assessed_at",
                    "fee_assessed_by",
                    "fee_waiver_reason",
                ]
            )


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("gridy_services", "0015_document_payment_proof_and_transacted_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="documentrequest",
            name="fee_assessment_status",
            field=models.CharField(
                choices=[
                    ("AWAITING_ASSESSMENT", "Awaiting Assessment"),
                    ("ASSESSED", "Staff-Assessed Fee"),
                    ("WAIVED", "Staff-Approved Waiver"),
                    ("STATUTORY_EXEMPT", "Statutory Exemption"),
                ],
                default="AWAITING_ASSESSMENT",
                help_text="Explicit provenance of clearance fee determination.",
                max_length=25,
            ),
        ),
        migrations.AddField(
            model_name="documentrequest",
            name="fee_assessed_by",
            field=models.ForeignKey(
                blank=True,
                help_text="Barangay staff member who assessed or waived the clearance fee.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assessed_document_requests",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="documentrequest",
            name="fee_assessed_at",
            field=models.DateTimeField(
                blank=True,
                help_text="Timestamp when the clearance fee was assessed or waived.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="documentrequest",
            name="fee_waiver_reason",
            field=models.TextField(
                blank=True,
                help_text="Mandatory written justification when an ordinary fee is waived by staff.",
            ),
        ),
        migrations.RunPython(
            backfill_fee_assessment_provenance,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
