from unittest.mock import patch

from django.core.management import call_command, CommandError
from django.test import TestCase, override_settings

from gridy_auth.models import Barangay, Resident, User
from gridy_services.models import DocumentRequest, QueueTicket


class SeedBarangaysCommandTests(TestCase):
    @override_settings(DEBUG=True)
    def test_seed_barangays_is_idempotent_and_provisions_three_tenants(self):
        call_command("seed_barangays", confirm_demo_only=True)
        call_command("seed_barangays", confirm_demo_only=True)

        expected_names = [
            "Barangay Ibabang Dupay",
            "Barangay Daungan",
            "Barangay Cotta",
        ]
        self.assertEqual(
            Barangay.objects.filter(name__in=expected_names).count(),
            3,
        )

        cotta = Barangay.objects.get(name="Barangay Cotta")
        admin_cotta = User.objects.get(username="admin_cotta")

        self.assertEqual(admin_cotta.barangay, cotta)
        self.assertEqual(admin_cotta.role, User.Role.ADMIN)
        self.assertFalse(admin_cotta.has_usable_password())

        self.assertEqual(
            User.objects.filter(
                barangay=cotta,
                role=User.Role.FIELD_OFFICIAL,
            ).count(),
            1,
        )
        self.assertEqual(
            Resident.objects.filter(user__barangay=cotta).count(),
            2,
        )
        self.assertEqual(
            DocumentRequest.objects.filter(barangay=cotta).count(),
            2,
        )
        self.assertEqual(
            QueueTicket.objects.filter(barangay=cotta).count(),
            2,
        )

        self.assertFalse(User.objects.get(username="admin_dupay").has_usable_password())
        self.assertFalse(User.objects.get(username="admin_daungan").has_usable_password())

    @override_settings(DEBUG=False)
    def test_seed_barangays_refuses_when_debug_is_disabled(self):
        with self.assertRaises(CommandError):
            call_command("seed_barangays", confirm_demo_only=True)

    @override_settings(DEBUG=True)
    def test_seed_barangays_refuses_remote_database_hosts(self):
        with patch(
            "gridy_auth.management.commands.demo_seed_safety.connection.settings_dict",
            {"HOST": "production-db.example.com"},
        ), self.assertRaises(CommandError):
            call_command("seed_barangays", confirm_demo_only=True)
