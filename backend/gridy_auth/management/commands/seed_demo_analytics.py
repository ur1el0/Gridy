from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from gridy_auth.management.commands.demo_seed_safety import require_local_demo_database
from gridy_auth.models import Barangay, Resident, User
from gridy_communications.models import Announcement
from gridy_reports.models import IssueReport
from gridy_services.models import AidRequest, DocumentRequest, QueueTicket


DEMO_BARANGAYS = (
    (
        "north",
        "Gridy Demo Barangay North",
        "KapitBayan Demo Barangay North",
    ),
    (
        "central",
        "Gridy Demo Barangay Central",
        "KapitBayan Demo Barangay Central",
    ),
    (
        "south",
        "Gridy Demo Barangay South",
        "KapitBayan Demo Barangay South",
    ),
)


class Command(BaseCommand):
    help = "Create synthetic, idempotent analytics records for a local presentation database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm-demo-only",
            action="store_true",
            help="Confirm that the selected database is disposable demo data only.",
        )

    def handle(self, *args, **options):
        require_local_demo_database(confirmed=options["confirm_demo_only"])

        with transaction.atomic():
            for tenant_index, (key, legacy_name, barangay_name) in enumerate(
                DEMO_BARANGAYS,
                start=1,
            ):
                self._rename_legacy_barangay(legacy_name, barangay_name)
                barangay, _ = Barangay.objects.get_or_create(
                    name=barangay_name,
                    defaults={
                        "captain_name": "Synthetic presentation record",
                        "office_contact": "Demo data only; not an official contact",
                    },
                )
                admin = self._get_demo_user(
                    username=f"gridy_demo_{key}_official",
                    role=User.Role.ADMIN,
                    barangay=barangay,
                    is_staff=True,
                )
                residents = []
                for resident_index in range(1, 5):
                    username = f"gridy_demo_{key}_resident_{resident_index:02d}"
                    resident_user = self._get_demo_user(
                        username=username,
                        role=User.Role.RESIDENT,
                        barangay=barangay,
                    )
                    Resident.objects.get_or_create(
                        user=resident_user,
                        defaults={
                            "full_name": f"Synthetic Resident {tenant_index}-{resident_index:02d}",
                            "birth_date": timezone.localdate().replace(
                                year=1990 + resident_index,
                                month=1 + (resident_index % 12),
                                day=1 + resident_index,
                            ),
                            "voter_status": resident_index % 2 == 0,
                            "purok": f"Demo Purok {resident_index}",
                            "is_verified": True,
                        },
                    )
                    residents.append(resident_user)

                self._seed_announcements(barangay, admin)
                self._seed_documents(barangay, residents, tenant_index)
                self._seed_queue(barangay, tenant_index)
                self._seed_reports(residents, tenant_index)
                self._seed_aid_requests(barangay, residents)

        self.stdout.write(self.style.SUCCESS(
            "Synthetic KapitBayan presentation data is ready in three isolated demo barangays."
        ))

    def _rename_legacy_barangay(self, legacy_name, current_name):
        legacy_rows = list(
            Barangay.objects.filter(name=legacy_name).order_by("pk")[:2]
        )
        current_rows = list(
            Barangay.objects.filter(name=current_name).order_by("pk")[:2]
        )
        if (
            len(legacy_rows) > 1
            or len(current_rows) > 1
            or (legacy_rows and current_rows)
        ):
            raise CommandError(
                f"Cannot safely migrate ambiguous demo barangay names: {legacy_name}."
            )
        if legacy_rows:
            legacy_rows[0].name = current_name
            legacy_rows[0].save(update_fields=["name"])

    def _get_demo_user(self, *, username, role, barangay, is_staff=False):
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@example.invalid",
                "first_name": "Synthetic",
                "last_name": "Demo User",
                "role": role,
                "barangay": barangay,
                "is_staff": is_staff,
                "is_active": True,
            },
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])
        elif (
            user.role != role
            or user.barangay_id != barangay.pk
            or user.has_usable_password()
        ):
            raise CommandError(
                f"Existing account {username} does not match the locked demo fixture."
            )
        return user

    def _backdate(self, model, instance, created, moment):
        if created:
            model.objects.filter(pk=instance.pk).update(created_at=moment)

    def _seed_announcements(self, barangay, admin):
        for number, title in enumerate(
            ("Demo service information", "Demo community notice"),
            start=1,
        ):
            announcement, created = Announcement.objects.get_or_create(
                title=f"DEMO {barangay.pk}-{number}: {title}",
                defaults={
                    "content": (
                        "Synthetic presentation content only. Confirm current "
                        "barangay schedules and details through official channels."
                    ),
                    "is_pinned": number == 1,
                    "created_by": admin,
                },
            )
            self._backdate(
                Announcement,
                announcement,
                created,
                timezone.now() - timedelta(days=number * 8),
            )

    def _seed_documents(self, barangay, residents, tenant_index):
        statuses = (
            DocumentRequest.Status.PENDING,
            DocumentRequest.Status.PROCESSING,
            DocumentRequest.Status.READY_FOR_PICKUP,
            DocumentRequest.Status.RELEASED,
            DocumentRequest.Status.REJECTED,
        )
        for sequence in range(1, 26):
            resident = residents[(sequence - 1) % len(residents)]
            status = statuses[(sequence - 1) % len(statuses)]
            exempt = sequence % 7 == 0
            fee = 0 if exempt else 50
            document_type = "Certificate of Indigency" if exempt else "Barangay Clearance"
            payment_status = (
                DocumentRequest.PaymentStatus.NOT_REQUIRED
                if exempt
                else DocumentRequest.PaymentStatus.VERIFIED
                if status == DocumentRequest.Status.RELEASED
                else DocumentRequest.PaymentStatus.UNPAID
            )
            marker = f"KapitBayan Demo {tenant_index:02d} DOC {sequence:03d}"
            legacy_marker = f"GRIDY DEMO {tenant_index:02d} DOC {sequence:03d}"
            matching_documents = list(
                DocumentRequest.objects.filter(
                    user=resident,
                    purpose__in=(marker, legacy_marker),
                ).order_by("pk")[:2]
            )
            if len(matching_documents) > 1:
                raise CommandError(
                    f"Cannot safely migrate duplicate demo document marker: {legacy_marker}."
                )
            if matching_documents:
                document = matching_documents[0]
                created = False
                if document.purpose == legacy_marker:
                    document.purpose = marker
                    document.save(update_fields=["purpose"])
            else:
                document, created = DocumentRequest.objects.get_or_create(
                    user=resident,
                    purpose=marker,
                    defaults={
                        "barangay": barangay,
                        "document_type": document_type,
                        "status": status,
                        "fee_amount": fee,
                        "payment_method": (
                            "CASH"
                            if payment_status
                            == DocumentRequest.PaymentStatus.VERIFIED
                            else ""
                        ),
                        "payment_status": payment_status,
                        "or_number": (
                            f"DEMO-OR-{tenant_index:02d}-{sequence:03d}"
                            if payment_status
                            == DocumentRequest.PaymentStatus.VERIFIED
                            else ""
                        ),
                    },
                )
            self._backdate(
                DocumentRequest,
                document,
                created,
                timezone.now() - timedelta(days=(sequence * 3) % 90),
            )

    def _seed_queue(self, barangay, tenant_index):
        now = timezone.now()
        for sequence in range(1, 31):
            if sequence == 1:
                status = QueueTicket.Status.SERVING
            elif sequence in (2, 3):
                status = QueueTicket.Status.WAITING
            elif sequence % 11 == 0:
                status = QueueTicket.Status.CANCELLED
            else:
                status = QueueTicket.Status.COMPLETED
            is_priority = sequence % 3 == 0
            ticket_number = f"D{tenant_index}{sequence:03d}"
            ticket, created = QueueTicket.objects.get_or_create(
                barangay=barangay,
                ticket_number=ticket_number,
                defaults={
                    "service_type": "DOCUMENT",
                    "status": status,
                    "priority_status": (
                        QueueTicket.Priority.PRIORITY
                        if is_priority
                        else QueueTicket.Priority.REGULAR
                    ),
                    "is_priority": is_priority,
                },
            )
            age_days = (sequence - 1) % 30
            self._backdate(
                QueueTicket,
                ticket,
                created,
                now - timedelta(days=age_days),
            )

    def _seed_reports(self, residents, tenant_index):
        categories = tuple(IssueReport.Category.values)
        urgencies = tuple(IssueReport.Urgency.values)
        statuses = tuple(IssueReport.Status.values)
        for sequence in range(1, 13):
            resident = residents[(sequence - 1) % len(residents)]
            age_days = sequence * 6
            incident_time = timezone.now() - timedelta(days=age_days)
            report, created = IssueReport.objects.get_or_create(
                reporter=resident,
                title=f"DEMO {tenant_index:02d}: Synthetic report {sequence:02d}",
                defaults={
                    "description": "Synthetic presentation record; not a real incident.",
                    "location": f"Demo Purok {(sequence % 4) + 1}",
                    "category": categories[(sequence - 1) % len(categories)],
                    "urgency": urgencies[(sequence - 1) % len(urgencies)],
                    "status": statuses[(sequence - 1) % len(statuses)],
                    "incident_datetime": incident_time,
                },
            )
            self._backdate(IssueReport, report, created, incident_time)

    def _seed_aid_requests(self, barangay, residents):
        statuses = tuple(AidRequest.Status.values)
        for sequence in range(1, 4):
            resident = residents[(sequence - 1) % len(residents)]
            marker = f"Synthetic presentation record {sequence}; not a real application."
            request, created = AidRequest.objects.get_or_create(
                requester=resident,
                barangay=barangay,
                assistance_type=(
                    "Medical assistance" if sequence % 2 else "Educational assistance"
                ),
                reason=marker,
                defaults={
                    "status": statuses[(sequence - 1) % len(statuses)],
                },
            )
            self._backdate(
                AidRequest,
                request,
                created,
                timezone.now() - timedelta(days=sequence * 9),
            )
