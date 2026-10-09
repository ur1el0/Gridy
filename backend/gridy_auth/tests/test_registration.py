import os
import subprocess
import sys
from pathlib import Path

from django.conf import settings
from django.urls import reverse
from rest_framework import status

from gridy_auth.models import Barangay, User
from .base import IsolatedAuthAPITestCase


class AuthRegistrationAPITests(IsolatedAuthAPITestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(name="Auth Fixture Barangay")
        self.username = "resident_test"
        self.password = "SecurePassword123!"
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email="resident@example.com",
            role=User.Role.RESIDENT,
        )

    def test_admin_passkey_settings_fail_closed_when_missing_or_blank(self):
        script = (
            "import environ; "
            "environ.Env.read_env = lambda *args, **kwargs: None; "
            "import config.settings"
        )
        backend_dir = Path(__file__).resolve().parents[2]
        base_environment = os.environ.copy()
        base_environment.pop("ADMIN_REGISTRATION_PASSKEY", None)
        base_environment["SECRET_KEY"] = "test-only-settings-bootstrap-key"

        for label, value in (("missing", None), ("blank", "")):
            with self.subTest(value=label):
                environment = base_environment.copy()
                if value is not None:
                    environment["ADMIN_REGISTRATION_PASSKEY"] = value

                result = subprocess.run(
                    [sys.executable, "-c", script],
                    cwd=backend_dir,
                    env=environment,
                    capture_output=True,
                    text=True,
                    check=False,
                )

                self.assertNotEqual(result.returncode, 0)
                self.assertIn("ADMIN_REGISTRATION_PASSKEY", result.stderr)

    def test_admin_registration_rejects_known_default_passkey(self):
        barangay = Barangay.objects.create(name="Barangay Passkey Test")
        url = reverse('auth_register_admin')
        payload = {
            "username": "known_default_attempt",
            "full_name": "Unauthorized Admin",
            "barangay_id": barangay.id,
            "email": "known-default-attempt@example.com",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
            "affirmation": True,
            "passkey": "LGU-DEFAULT-PASSKEY",
        }

        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("passkey", response.data)
        self.assertFalse(
            User.objects.filter(email="known-default-attempt@example.com").exists()
        )

    def test_admin_registration_success(self):
        barangay = Barangay.objects.create(name="Barangay Central")
        url = reverse('auth_register_admin')
        payload = {
            "username": "admin_central",
            "full_name": "Juan De La Cruz",
            "barangay_id": barangay.id,
            "email": "juandelacruz@example.com",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
            "affirmation": True,
            "passkey": settings.ADMIN_REGISTRATION_PASSKEY
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="juandelacruz@example.com").exists())
        user = User.objects.get(email="juandelacruz@example.com")
        self.assertEqual(user.username, "admin_central")
        self.assertEqual(user.role, User.Role.ADMIN)
        self.assertEqual(user.first_name, "Juan")
        self.assertEqual(user.last_name, "De La Cruz")
        self.assertEqual(user.barangay, barangay)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_active)

        # Verify admin can log in with username
        login_url = reverse('auth_login')
        login_resp = self.client.post(login_url, {"username": "admin_central", "password": "SecurePassword123!"}, format='json')
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)

        # Verify admin can also log in with email
        login_email_resp = self.client.post(login_url, {"username": "juandelacruz@example.com", "password": "SecurePassword123!"}, format='json')
        self.assertEqual(login_email_resp.status_code, status.HTTP_200_OK)

    def test_admin_registration_requires_barangay(self):
        response = self.client.post(
            reverse("auth_register_admin"),
            {
                "username": "unassigned_official",
                "full_name": "Unassigned Official",
                "email": "unassigned@example.com",
                "password": "SecurePassword123!",
                "confirm_password": "SecurePassword123!",
                "affirmation": True,
                "passkey": settings.ADMIN_REGISTRATION_PASSKEY,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("barangay_id", response.data)
        self.assertFalse(User.objects.filter(username="unassigned_official").exists())

    def test_admin_registration_duplicate_username(self):
        User.objects.create_user(
            username="existing_admin_handle",
            email="handle@example.com",
            password="SecurePassword123!",
            role=User.Role.ADMIN
        )
        url = reverse('auth_register_admin')
        payload = {
            "username": "existing_admin_handle",
            "full_name": "Duplicate Admin",
            "barangay_id": self.barangay.id,
            "email": "another@example.com",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
            "affirmation": True,
            "passkey": settings.ADMIN_REGISTRATION_PASSKEY
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_admin_registration_password_mismatch(self):
        url = reverse('auth_register_admin')
        payload = {
            "full_name": "Juan De La Cruz",
            "barangay_id": self.barangay.id,
            "email": "mismatch@example.com",
            "password": "SecurePassword123!",
            "confirm_password": "DifferentPassword123!",
            "affirmation": True,
            "passkey": settings.ADMIN_REGISTRATION_PASSKEY
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", response.data)

    def test_admin_registration_missing_affirmation(self):
        url = reverse('auth_register_admin')
        payload = {
            "full_name": "Juan De La Cruz",
            "barangay_id": self.barangay.id,
            "email": "unaffirmed@example.com",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
            "affirmation": False,
            "passkey": settings.ADMIN_REGISTRATION_PASSKEY
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("affirmation", response.data)

    def test_admin_registration_duplicate_email(self):
        User.objects.create_user(
            username="existing_admin",
            email="existing@example.com",
            password="SecurePassword123!",
            role=User.Role.ADMIN
        )
        url = reverse('auth_register_admin')
        payload = {
            "full_name": "Duplicate Admin",
            "barangay_id": self.barangay.id,
            "email": "existing@example.com",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
            "affirmation": True,
            "passkey": settings.ADMIN_REGISTRATION_PASSKEY
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_admin_registration_invalid_barangay(self):
        url = reverse('auth_register_admin')
        payload = {
            "full_name": "Juan De La Cruz",
            "barangay_id": 99999,
            "email": "bad_brgy@example.com",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
            "affirmation": True,
            "passkey": settings.ADMIN_REGISTRATION_PASSKEY
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("barangay_id", response.data)

    def test_user_registration_success(self):
        url = reverse('auth_register')
        payload = {
            "username": "new_resident",
            "email": "new@example.com",
            "password": "ValidPassword123!",
            "full_name": "Test Resident",
            "birth_date": "2000-01-01",
            "barangay_id": self.barangay.id,
            "privacy_consent": True,
            "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username="new_resident").count(), 1)
        self.assertEqual(User.objects.get(username="new_resident").barangay, self.barangay)

        resident = User.objects.get(username="new_resident").profile
        self.assertEqual(
            resident.privacy_consent_version,
            settings.PRIVACY_CONSENT_VERSION,
        )
        self.assertIsNotNone(resident.privacy_consent_at)

    def test_user_registration_requires_barangay(self):
        response = self.client.post(
            reverse("auth_register"),
            {
                "username": "resident_without_tenant",
                "email": "resident-without-tenant@example.com",
                "password": "ValidPassword123!",
                "full_name": "Resident Without Tenant",
                "birth_date": "2000-01-01",
                "privacy_consent": True,
                "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("barangay_id", response.data)
        self.assertFalse(User.objects.filter(username="resident_without_tenant").exists())

    def test_user_registration_rejects_missing_false_or_stale_consent(self):
        cases = (
            (
                "missing",
                {"privacy_consent_version": settings.PRIVACY_CONSENT_VERSION},
                "privacy_consent",
            ),
            (
                "false",
                {
                    "privacy_consent": False,
                    "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
                },
                "privacy_consent",
            ),
            (
                "stale_version",
                {
                    "privacy_consent": True,
                    "privacy_consent_version": "resident-v0",
                },
                "privacy_consent_version",
            ),
        )

        for label, consent_fields, expected_error in cases:
            with self.subTest(consent_case=label):
                payload = {
                    "username": f"consent_{label}",
                    "email": f"consent_{label}@example.com",
                    "password": "ValidPassword123!",
                    "full_name": "Consent Test Resident",
                    "birth_date": "2000-01-01",
                    "barangay_id": self.barangay.id,
                    **consent_fields,
                }
                response = self.client.post(
                    reverse("auth_register"),
                    payload,
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST,
                )
                self.assertIn(expected_error, response.data)
                self.assertFalse(
                    User.objects.filter(username=payload["username"]).exists()
                )

    def test_user_registration_weak_password(self):
        url = reverse('auth_register')
        payload = {
            "username": "weak_resident",
            "email": "weak@example.com",
            "password": "123",
            "full_name": "Weak Password Test Resident",
            "birth_date": "2000-01-01",
            "barangay_id": self.barangay.id,
            "privacy_consent": True,
            "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
