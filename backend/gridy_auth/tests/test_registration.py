import os
import subprocess
import sys
from datetime import date, timedelta
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework import status

from gridy_auth.models import Barangay, Resident, User
from .base import IsolatedAuthAPITestCase


def create_test_image_upload(name="registration-proof.png"):
    image_data = BytesIO()
    Image.new("RGB", (1, 1), color="white").save(image_data, format="PNG")
    return SimpleUploadedFile(name, image_data.getvalue(), content_type="image/png")


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

    def test_admin_registration_endpoint_is_disabled_under_adr_011(self):
        url = reverse('auth_register_admin')
        payload = {
            "username": "admin_attempt",
            "full_name": "Unauthorized Admin",
            "barangay_id": self.barangay.id,
            "email": "unauthorized@example.com",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
            "affirmation": True,
            "passkey": settings.ADMIN_REGISTRATION_PASSKEY,
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("detail", response.data)
        self.assertIn("ADR 011", response.data["detail"])
        self.assertFalse(User.objects.filter(username="admin_attempt").exists())

    def test_user_registration_rejects_future_birth_date(self):
        url = reverse('auth_register')
        future_date = (date.today() + timedelta(days=1)).isoformat()
        payload = {
            "username": "time_traveler",
            "email": "traveler@example.com",
            "password": "ValidPassword123!",
            "full_name": "Time Traveler",
            "birth_date": future_date,
            "barangay_id": self.barangay.id,
            "privacy_consent": True,
            "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
            "philsys_id_photo": create_test_image_upload(),
        }
        storage = Resident._meta.get_field("philsys_id_photo").storage
        with patch.object(storage, "save", side_effect=lambda name, content, max_length=None: name):
            response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("birth_date", response.data)
        self.assertIn("cannot be in the future", str(response.data["birth_date"]))
        self.assertFalse(User.objects.filter(username="time_traveler").exists())

    def test_user_registration_minor_requires_verified_same_barangay_guardian(self):
        url = reverse('auth_register')
        minor_birth_date = (date.today() - timedelta(days=365 * 10)).isoformat()

        # Case 1: Minor without guardian
        payload = {
            "username": "minor_no_guardian",
            "email": "minor1@example.com",
            "password": "ValidPassword123!",
            "full_name": "Minor Resident",
            "birth_date": minor_birth_date,
            "barangay_id": self.barangay.id,
            "privacy_consent": True,
            "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
            "philsys_id_photo": create_test_image_upload(),
        }
        storage = Resident._meta.get_field("philsys_id_photo").storage
        with patch.object(storage, "save", side_effect=lambda name, content, max_length=None: name):
            resp = self.client.post(url, payload, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("guardian_id", resp.data)

        # Case 2: Guardian does not exist
        payload["guardian_id"] = "non_existent_guardian"
        payload["philsys_id_photo"] = create_test_image_upload()
        with patch.object(storage, "save", side_effect=lambda name, content, max_length=None: name):
            resp = self.client.post(url, payload, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("guardian_id", resp.data)

        # Case 3: Guardian is from another barangay
        other_barangay = Barangay.objects.create(name="Other Barangay For Guardian")
        other_user = User.objects.create_user(
            username="other_guardian",
            role=User.Role.RESIDENT,
            barangay=other_barangay,
        )
        Resident.objects.create(
            user=other_user,
            full_name="Other Guardian",
            birth_date="1980-01-01",
            is_verified=True,
        )
        payload["guardian_id"] = "other_guardian"
        payload["philsys_id_photo"] = create_test_image_upload()
        with patch.object(storage, "save", side_effect=lambda name, content, max_length=None: name):
            resp = self.client.post(url, payload, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("guardian_id", resp.data)

        # Case 4: Guardian is in same barangay but unverified
        local_unverified = User.objects.create_user(
            username="unverified_guardian",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        Resident.objects.create(
            user=local_unverified,
            full_name="Unverified Guardian",
            birth_date="1980-01-01",
            is_verified=False,
        )
        payload["guardian_id"] = "unverified_guardian"
        payload["philsys_id_photo"] = create_test_image_upload()
        with patch.object(storage, "save", side_effect=lambda name, content, max_length=None: name):
            resp = self.client.post(url, payload, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("guardian_id", resp.data)

        # Case 5: Guardian is in same barangay, RESIDENT, and verified -> SUCCESS
        local_verified = User.objects.create_user(
            username="verified_guardian",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        Resident.objects.create(
            user=local_verified,
            full_name="Verified Guardian",
            birth_date="1980-01-01",
            is_verified=True,
        )
        payload["guardian_id"] = "verified_guardian"
        payload["philsys_id_photo"] = create_test_image_upload()
        with patch.object(storage, "save", side_effect=lambda name, content, max_length=None: name):
            resp = self.client.post(url, payload, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="minor_no_guardian").exists())

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
            "philsys_id_photo": create_test_image_upload(),
        }

        storage = Resident._meta.get_field("philsys_id_photo").storage
        with patch.object(
            storage,
            "save",
            side_effect=lambda name, content, max_length=None: name,
        ):
            response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username="new_resident").count(), 1)
        self.assertEqual(User.objects.get(username="new_resident").barangay, self.barangay)

        resident = User.objects.get(username="new_resident").profile
        self.assertEqual(
            resident.privacy_consent_version,
            settings.PRIVACY_CONSENT_VERSION,
        )
        self.assertIsNotNone(resident.privacy_consent_at)

    def test_user_registration_requires_an_uploaded_id_or_residency_proof(self):
        response = self.client.post(
            reverse("auth_register"),
            {
                "username": "resident_without_proof",
                "email": "resident-without-proof@example.com",
                "password": "ValidPassword123!",
                "full_name": "Resident Without Proof",
                "birth_date": "2000-01-01",
                "barangay_id": self.barangay.id,
                "philsys_id_number": "1234567890123456",
                "privacy_consent": True,
                "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("verification_documents", response.data)
        self.assertFalse(
            User.objects.filter(username="resident_without_proof").exists()
        )

    def test_user_registration_accepts_a_residency_proof_without_an_id_photo(self):
        payload = {
            "username": "resident_with_bill_only",
            "email": "resident-with-bill@example.com",
            "password": "ValidPassword123!",
            "full_name": "Resident With Bill",
            "birth_date": "2000-01-01",
            "barangay_id": self.barangay.id,
            "privacy_consent": True,
            "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
            "utility_billing_photo": create_test_image_upload("utility-proof.png"),
        }
        storage = Resident._meta.get_field("utility_billing_photo").storage

        with patch.object(
            storage,
            "save",
            side_effect=lambda name, content, max_length=None: name,
        ):
            response = self.client.post(
                reverse("auth_register"), payload, format="multipart"
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(username="resident_with_bill_only").exists()
        )

    def test_user_registration_accepts_a_secondary_id_without_other_proofs(self):
        payload = {
            "username": "resident_with_secondary_id",
            "email": "resident-with-secondary-id@example.com",
            "password": "ValidPassword123!",
            "full_name": "Resident With Secondary ID",
            "birth_date": "2000-01-01",
            "barangay_id": self.barangay.id,
            "privacy_consent": True,
            "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
            "secondary_id_type": "Passport",
            "secondary_id_photo": create_test_image_upload("passport.png"),
        }
        storage = Resident._meta.get_field("secondary_id_photo").storage

        with patch.object(
            storage,
            "save",
            side_effect=lambda name, content, max_length=None: name,
        ):
            response = self.client.post(
                reverse("auth_register"), payload, format="multipart"
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(username="resident_with_secondary_id").exists()
        )

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
