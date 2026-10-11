import io
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status

from gridy_auth.models import Barangay, User
from .base import IsolatedAuthAPITestCase


class ResidentImportAPITests(IsolatedAuthAPITestCase):
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

    def _authenticate_as_importing_official(self):
        barangay = Barangay.objects.create(name="Import Error Barangay")
        official = User.objects.create_user(
            username="import_error_official",
            email="import-error-official@example.com",
            password="ImportErrorTestPassword123!",
            role=User.Role.ADMIN,
            barangay=barangay,
        )
        self.client.force_authenticate(user=official)

    def test_import_file_read_error_is_sanitized(self):
        self._authenticate_as_importing_official()
        uploaded_file = SimpleUploadedFile(
            "residents.csv",
            b"\xff",
            content_type="text/csv",
        )

        with self.assertLogs(
            "gridy_auth.views.residents",
            level="ERROR",
        ) as captured_logs:
            response = self.client.post(
                reverse("import_residents"),
                {"file": uploaded_file},
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"],
            "The uploaded resident file could not be read.",
        )
        self.assertTrue(any(record.exc_info for record in captured_logs.records))

    @patch(
        "gridy_auth.views.residents.transaction.atomic",
        side_effect=RuntimeError("PRIVATE_DATABASE_DIAGNOSTIC"),
    )
    def test_import_database_error_is_sanitized(self, _atomic):
        self._authenticate_as_importing_official()
        uploaded_file = SimpleUploadedFile(
            "residents.csv",
            b"username,email\n",
            content_type="text/csv",
        )

        with self.assertLogs(
            "gridy_auth.views.residents",
            level="ERROR",
        ) as captured_logs:
            response = self.client.post(
                reverse("import_residents"),
                {"file": uploaded_file},
                format="multipart",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
        self.assertEqual(
            response.data["detail"],
            "Resident import could not be completed.",
        )
        self.assertNotIn(
            "PRIVATE_DATABASE_DIAGNOSTIC",
            response.data["detail"],
        )
        self.assertTrue(any(record.exc_info for record in captured_logs.records))

    def test_import_residents_requires_auth(self):
        url = reverse('import_residents')
        response = self.client.post(url, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_import_residents_blocked_for_resident(self):
        # Log in as a resident
        self.client.force_login(self.user)
        url = reverse('import_residents')
        response = self.client.post(url, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_import_residents_success(self):
        # Create an official (admin)
        official = User.objects.create_user(
            username="official_test_import",
            password="SecurePassword123!",
            role=User.Role.ADMIN
        )
        self.client.force_login(official)

        # Mock CSV data inside memory using BytesIO
        csv_data = (
            "username,email,full_name,birth_date,contact_number,voter_status\n"
            "imported1,imported1@example.com,Imported One,1995-10-15,09170000001,True\n"
            "imported2,,Imported Two,1988-02-20,,False\n"
        )
        csv_file = io.BytesIO(csv_data.encode('utf-8'))
        csv_file.name = 'residents.csv'

        url = reverse('import_residents')
        response = self.client.post(url, {'file': csv_file}, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['imported'], 2)
        self.assertEqual(response.data['skipped_due_to_duplicate'], 0)
        self.assertEqual(len(response.data['errors']), 0)

        # Verify database records were created properly
        self.assertTrue(User.objects.filter(username="imported1").exists())
        user1 = User.objects.get(username="imported1")
        self.assertEqual(user1.profile.full_name, "Imported One")
        self.assertEqual(user1.profile.birth_date.strftime("%Y-%m-%d"), "1995-10-15")
        self.assertTrue(user1.profile.voter_status)

        # Imported residents keep their census record but cannot log in with a birth date.
        self.assertFalse(user1.has_usable_password())
        self.assertFalse(user1.check_password("19951015"))
        self.assertTrue(user1.profile.is_verified)
        self.assertIsNone(user1.profile.privacy_consent_version)
        self.assertIsNone(user1.profile.privacy_consent_at)

        login_response = self.client.post(
            reverse("auth_login"),
            {
                "username": "imported1",
                "password": "19951015",
            },
            format="json",
        )
        self.assertEqual(
            login_response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        user2 = User.objects.get(username="imported2")
        self.assertEqual(user2.email, "")
        self.assertFalse(user2.has_usable_password())
        self.assertTrue(user2.profile.is_verified)

    def test_import_residents_rejects_case_insensitive_duplicate_email(self):
        User.objects.create_user(
            username="existing_mixed_case_email",
            email="Legacy.Resident@Example.org",
            password="SecurePassword123!",
            role=User.Role.RESIDENT,
        )
        self._authenticate_as_importing_official()
        uploaded_file = SimpleUploadedFile(
            "residents.csv",
            (
                b"username,email,full_name,birth_date,contact_number,voter_status\n"
                b"duplicate_email,legacy.resident@example.org,Duplicate Email,1995-10-14,,False\n"
            ),
            content_type="text/csv",
        )

        response = self.client.post(
            reverse("import_residents"),
            {"file": uploaded_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_207_MULTI_STATUS)
        self.assertEqual(response.data["imported"], 0)
        self.assertEqual(len(response.data["errors"]), 1)
        self.assertIn("already in use", response.data["errors"][0])
        self.assertFalse(User.objects.filter(username="duplicate_email").exists())

    def test_import_residents_validation_error(self):
        official = User.objects.create_user(
            username="official_test_import_err",
            password="SecurePassword123!",
            role=User.Role.ADMIN
        )
        self.client.force_login(official)

        # Mock CSV containing rows with missing fields and bad date format
        csv_data = (
            "username,email,full_name,birth_date,contact_number,voter_status\n"  # <-- Comma after email
            "badrow1,bad1@example.com,,1995-10-14,,True\n" # missing full_name
            "badrow2,,Bad Date,invalid_date,,False\n" # truly bad date
            "imported3,,Imported Three,2001-09-09,,False\n" # valid (YYYY-MM-DD)
            "imported4,,Imported Four,09-09-2001,,False\n" # valid fallback (MM-DD-YYYY)
            "imported5,,Imported Five,09/09/2001,,False\n" # valid fallback (MM/DD/YYYY)
        )
        csv_file = io.BytesIO(csv_data.encode('utf-8'))
        csv_file.name = 'residents_err.csv'

        url = reverse('import_residents')
        response = self.client.post(url, {'file': csv_file}, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_207_MULTI_STATUS)
        self.assertEqual(response.data['imported'], 3)
        self.assertEqual(len(response.data['errors']), 2)
        self.assertTrue(User.objects.filter(username="imported3").exists())
