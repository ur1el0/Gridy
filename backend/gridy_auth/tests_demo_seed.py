from importlib import import_module
from io import StringIO
from types import SimpleNamespace
from unittest.mock import patch

from django.apps import apps
from django.db import connection
from django.core.management import call_command, CommandError
from django.test import TestCase, override_settings

from gridy_auth.models import Barangay, Resident, User
from gridy_services.models import AidRequest, DocumentRequest, QueueTicket


class DemoAnalyticsSeedTests(TestCase):
    @override_settings(DEBUG=True)
    def test_seed_is_synthetic_idempotent_and_accounts_have_unusable_passwords(self):
        call_command("seed_demo_analytics", confirm_demo_only=True, stdout=StringIO())
        first_counts = self._counts()

        call_command("seed_demo_analytics", confirm_demo_only=True, stdout=StringIO())

        self.assertEqual(self._counts(), first_counts)
        self.assertEqual(Barangay.objects.filter(name__startswith="Gridy Demo Barangay").count(), 3)
        self.assertEqual(Resident.objects.filter(user__username__startswith="gridy_demo_").count(), 12)
        self.assertTrue(
            all(
                not user.has_usable_password()
                for user in User.objects.filter(username__startswith="gridy_demo_")
            )
        )
        self.assertGreater(QueueTicket.objects.filter(barangay__name__startswith="Gridy Demo").count(), 0)
        self.assertGreater(DocumentRequest.objects.filter(purpose__startswith="GRIDY DEMO").count(), 0)
        self.assertGreater(AidRequest.objects.filter(reason__startswith="Synthetic presentation").count(), 0)

    @override_settings(DEBUG=False)
    def test_refuses_to_seed_when_debug_is_disabled(self):
        with self.assertRaises(CommandError):
            call_command("seed_demo_analytics", confirm_demo_only=True, stdout=StringIO())

    @override_settings(DEBUG=True)
    def test_refuses_to_seed_remote_database_hosts_even_with_confirmation_flag(self):
        with patch(
            "gridy_auth.management.commands.demo_seed_safety.connection.settings_dict",
            {"HOST": "ep-demo.ap-southeast-1.aws.neon.tech"},
        ), self.assertRaises(CommandError):
            call_command("seed_demo_analytics", confirm_demo_only=True, stdout=StringIO())

    @override_settings(DEBUG=True)
    def test_requires_explicit_confirmation(self):
        with self.assertRaises(CommandError):
            call_command("seed_demo_analytics", stdout=StringIO())

    def _counts(self):
        return {
            "barangays": Barangay.objects.filter(name__startswith="Gridy Demo Barangay").count(),
            "users": User.objects.filter(username__startswith="gridy_demo_").count(),
            "residents": Resident.objects.filter(user__username__startswith="gridy_demo_").count(),
            "documents": DocumentRequest.objects.filter(purpose__startswith="GRIDY DEMO").count(),
            "tickets": QueueTicket.objects.filter(barangay__name__startswith="Gridy Demo").count(),
            "aid_requests": AidRequest.objects.filter(reason__startswith="Synthetic presentation").count(),
        }


class LegacyDemoCredentialMigrationTests(TestCase):
    def test_migration_disables_only_exact_legacy_demo_accounts(self):
        seeded_user = User.objects.create_user(
            username="admin_dupay",
            email="captain.dupay@gridy.local",
            password="seeded",
        )
        same_username_user = User.objects.create_user(
            username="admin_dupay_lookalike",
            email="captain.dupay@another.example",
            password="normal",
        )
        same_email_user = User.objects.create_user(
            username="another_lookalike",
            email="captain.dupay@gridy.local",
            password="normal",
        )
        ordinary_user = User.objects.create_user(
            username="presentation_operator",
            password="normal",
        )
        migration = import_module(
            "gridy_auth.migrations.0014_revoke_seeded_demo_passwords"
        )

        migration.revoke_seeded_demo_passwords(
            apps,
            SimpleNamespace(connection=connection),
        )

        seeded_user.refresh_from_db()
        same_username_user.refresh_from_db()
        same_email_user.refresh_from_db()
        ordinary_user.refresh_from_db()
        self.assertFalse(seeded_user.has_usable_password())
        self.assertTrue(same_username_user.has_usable_password())
        self.assertTrue(same_email_user.has_usable_password())
        self.assertTrue(ordinary_user.has_usable_password())
