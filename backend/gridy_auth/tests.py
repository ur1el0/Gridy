import os
import subprocess
import sys
from pathlib import Path

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from gridy_auth.models import User, Resident, Barangay
from django.core.management import call_command
from django.conf import settings
from gridy_services.models import DocumentRequest, QueueTicket
from gridy_audit.models import AuditLog

# Create your tests here.

class AuthAPITests(APITestCase):
    def setUp(self):
        #create a test resident user
        self.username = "resident_test"
        self.password = "SecurePassword123!"
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email="resident@example.com",
            role=User.Role.RESIDENT
        )

    def test_admin_passkey_settings_fail_closed_when_missing_or_blank(self):
        script = (
            "import environ; "
            "environ.Env.read_env = lambda *args, **kwargs: None; "
            "import config.settings"
        )
        backend_dir = Path(__file__).resolve().parents[1]
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
            "privacy_consent": True,
            "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username="new_resident").count(), 1)

        resident = User.objects.get(username="new_resident").profile
        self.assertEqual(
            resident.privacy_consent_version,
            settings.PRIVACY_CONSENT_VERSION,
        )
        self.assertIsNotNone(resident.privacy_consent_at)

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
            "privacy_consent": True,
            "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)


    def test_user_login_success(self):
        url = reverse('auth_login')
        payload  = {
            "username": self.username,
            "password": self.password
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        self.assertIn('refresh_token', response.cookies)
        cookie = response.cookies['refresh_token']
        self.assertTrue(cookie['httponly'])
        self.assertEqual(cookie['samesite'], 'Strict')

    def test_profile_endpoint_requires_auth(self):
        # Hardcoding path to catch routing bugs
        url = "/api/v1/auth/me/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_update_cannot_restore_revoked_verification(self):
        resident_profile = Resident.objects.create(
            user=self.user,
            full_name="Verification Test Resident",
            birth_date="1995-05-15",
            is_verified=False,
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            "/api/v1/auth/me/",
            {"profile": {"is_verified": True}},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resident_profile.refresh_from_db()
        self.assertFalse(resident_profile.is_verified)

    def test_profile_endpoint_success(self):
        #  1. Login the user to obtain a token
        login_url = reverse('auth_login')
        login_payload = {
            "username": self.username,
            "password": self.password
        }
        login_response = self.client.post(login_url, login_payload, format='json')
        token = login_response.data['access']

        # 2. Add JWT token to Auth headers
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # 3. Request the user profile
        url = "/api/v1/auth/me/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.username)

    def test_self_deletion_preserves_audit_event_without_actor(self):
        user_id = self.user.pk
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(reverse("auth_me"))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=user_id).exists())

        audit_log = AuditLog.objects.get(
            action_type=AuditLog.ActionType.USER_ACTION,
            description__startswith=(
                f"User {self.username} (ID: {user_id}) voluntarily exercised"
            ),
        )
        self.assertIsNone(audit_log.action_by_id)
        self.assertTrue(
            str(audit_log).startswith("Deleted user - USER_ACTION at ")
        )

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
        import io
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

    def test_import_residents_validation_error(self):
        official = User.objects.create_user(
            username="official_test_import_err",
            password="SecurePassword123!",
            role=User.Role.ADMIN
        )
        self.client.force_login(official)

        # Mock CSV containing rows with missing fields and bad date format
        import io 
        csv_data = (
            "username,email,full_name,birth_date,contact_number,voter_status\n"  # <-- Comma after email
            "badrow1,bad1@example.com,,1995-10-14,,True\n" # missing full_name
            "badrow2,,Bad Date,10-15-1995,,False\n" # bad date format (MM-DD-YYYY)
            "imported3,,Imported Three,2001-09-09,,False\n" # valid
        )
        csv_file = io.BytesIO(csv_data.encode('utf-8'))
        csv_file.name = 'residents_err.csv'  # <-- Assign directly to the attribute

        url = reverse('import_residents')
        response = self.client.post(url, {'file': csv_file}, format='multipart')

        # 207 Multi-Status expected due to validation errors in rows 1 and 2
        self.assertEqual(response.status_code, status.HTTP_207_MULTI_STATUS)
        self.assertEqual(response.data['imported'], 1)
        self.assertEqual(len(response.data['errors']), 2)
        self.assertTrue(User.objects.filter(username="imported3").exists())

    def test_password_reset_revokes_all_existing_refresh_sessions(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils import timezone
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
        from gridy_auth.models import RefreshSession
        from rest_framework_simplejwt.token_blacklist.models import (
            BlacklistedToken,
            OutstandingToken,
        )

        login_url = reverse("auth_login")
        login_payload = {
            "username": self.username,
            "password": self.password,
        }

        first_login = self.client.post(
            login_url,
            login_payload,
            format="json",
        )
        self.assertEqual(first_login.status_code, status.HTTP_200_OK)
        first_refresh_token = first_login.cookies["refresh_token"].value

        second_login = self.client.post(
            login_url,
            login_payload,
            format="json",
        )
        self.assertEqual(second_login.status_code, status.HTTP_200_OK)
        second_refresh_token = second_login.cookies["refresh_token"].value

        self.assertEqual(
            RefreshSession.objects.filter(
                user=self.user,
                is_revoked=False,
            ).count(),
            2,
        )

        reset_response = self.client.post(
            reverse("password_reset_confirm"),
            {
                "uidb64": urlsafe_base64_encode(force_bytes(self.user.pk)),
                "token": default_token_generator.make_token(self.user),
                "new_password": "NewSecurePassword123!",
            },
            format="json",
        )
        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)

        self.assertEqual(
            RefreshSession.objects.filter(
                user=self.user,
                is_revoked=False,
            ).count(),
            0,
        )

        active_outstanding_tokens = OutstandingToken.objects.filter(
            user=self.user,
            expires_at__gt=timezone.now(),
        )
        self.assertTrue(active_outstanding_tokens.exists())

        for outstanding_token in active_outstanding_tokens:
            self.assertTrue(
                BlacklistedToken.objects.filter(
                    token=outstanding_token,
                ).exists()
            )

        self.client.cookies.pop("refresh_token", None)
        for old_refresh_token in (
            first_refresh_token,
            second_refresh_token,
        ):
            refresh_response = self.client.post(
                reverse("auth_token_refresh"),
                {"refresh": old_refresh_token},
                format="json",
            )
            self.assertEqual(
                refresh_response.status_code,
                status.HTTP_401_UNAUTHORIZED,
            )

        new_login = self.client.post(
            login_url,
            {
                "username": self.username,
                "password": "NewSecurePassword123!",
            },
            format="json",
        )
        self.assertEqual(new_login.status_code, status.HTTP_200_OK)
        self.assertEqual(
            RefreshSession.objects.filter(
                user=self.user,
                is_revoked=False,
            ).count(),
            1,
        )

    def test_token_refresh_denied_after_resident_verification_revoked(self):
        resident_profile = Resident.objects.create(
            user=self.user,
            full_name="Verification Test Resident",
            birth_date="1995-05-15",
            is_verified=True,
        )

        login_response = self.client.post(
            reverse("auth_login"),
            {
                "username": self.username,
                "password": self.password,
            },
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        resident_profile.is_verified = False
        resident_profile.save(update_fields=["is_verified"])

        refresh_response = self.client.post(reverse("auth_token_refresh"))

        self.assertEqual(
            refresh_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_token_refresh_via_cookie_success(self):
        from gridy_auth.models import RefreshSession
        # 1. Login to establish cookie
        login_url = reverse('auth_login')
        login_payload = {
            "username": self.username,
            "password": self.password
        }

        Resident.objects.create(
            user=self.user,
            full_name="Verified Test Resident",
            birth_date="1995-05-15",
            is_verified=True,
        )

        login_response = self.client.post(login_url, login_payload, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
    
        # Get initial session count
        self.assertEqual(RefreshSession.objects.filter(user=self.user, is_revoked=False).count(), 1)
        old_session = RefreshSession.objects.filter(user=self.user,  is_revoked=False).first()

        # 2. Call refresh endpoint (attaches cookies automatically)
        refresh_url = reverse('auth_token_refresh')
        refresh_response = self.client.post(refresh_url)
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

        # Verify old JTI session is revoked and a new active one is created
        old_session.refresh_from_db()
        self.assertTrue(old_session.is_revoked)
        self.assertEqual(RefreshSession.objects.filter(user=self.user, is_revoked=False).count(), 1)

    def test_token_refresh_fails_with_revoked_session(self):
        from gridy_auth.models import RefreshSession
        # 1. Login to establish cookie
        login_url = reverse('auth_login')
        login_payload = {
            "username": self.username,
            "password": self.password
        }
        login_response = self.client.post(login_url, login_payload, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        # 2. Revoke the session in database
        RefreshSession.objects.filter(user=self.user).update(is_revoked=True)
        # 3. Call refresh endpoint and verify rejection
        refresh_url = reverse('auth_token_refresh')
        refresh_response = self.client.post(refresh_url)
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_invalidates_cookie_and_session(self):
        from gridy_auth.models import RefreshSession
        # 1. Login to establish cookie
        login_url = reverse('auth_login')
        login_payload = {
            "username": self.username,
            "password": self.password
        }
        login_response = self.client.post(login_url, login_payload, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        # 2. Call logout view
        logout_url = reverse('auth_logout')
        logout_response = self.client.post(logout_url)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        # Verify cookie is cleared
        cookie = logout_response.cookies.get('refresh_token')
        self.assertTrue(not cookie or not cookie.value or cookie['max-age'] == 0)
        # Verify active session is revoked in database
        self.assertEqual(RefreshSession.objects.filter(user=self.user, is_revoked=False).count(), 0)

    def test_reject_resident_deletes_account(self):
        barangay = Barangay.objects.create(name="Resident Rejection Test")

        dummy_user = User.objects.create_user(
            username="dummy_pending",
            password="password123",
            email="dummy@example.com",
            role=User.Role.RESIDENT,
            barangay=barangay,
        )
        dummy_resident = Resident.objects.create(
            user=dummy_user,
            full_name="Dummy Pending",
            birth_date="2000-01-01",
        )

        self.user.role = User.Role.ADMIN
        self.user.barangay = barangay
        self.user.save()
        self.client.force_authenticate(user=self.user)

        url = reverse("reject_resident", args=[dummy_resident.pk])
        response = self.client.delete(
            url,
            {"rejection_reason": "The submitted details could not be verified."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=dummy_user.pk).exists())

        audit_log = AuditLog.objects.get(
            action_by=self.user,
            action_type=AuditLog.ActionType.USER_ACTION,
        )
        self.assertIn(
            "Reason: The submitted details could not be verified.",
            audit_log.description,
        )

    def test_reject_resident_requires_nonblank_reason(self):
        barangay = Barangay.objects.create(name="Rejection Reason Test")
        target_user = User.objects.create_user(
            username="pending_without_reason",
            password="password123",
            email="pending-without-reason@example.com",
            role=User.Role.RESIDENT,
            barangay=barangay,
        )
        resident = Resident.objects.create(
            user=target_user,
            full_name="Pending Resident",
            birth_date="2000-01-01",
        )

        self.user.role = User.Role.ADMIN
        self.user.barangay = barangay
        self.user.save()
        self.client.force_authenticate(user=self.user)

        url = reverse("reject_resident", args=[resident.pk])

        for reason in ("", "   "):
            with self.subTest(reason=reason):
                response = self.client.delete(
                    url,
                    {"rejection_reason": reason},
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertTrue(User.objects.filter(pk=target_user.pk).exists())
        self.assertFalse(
            AuditLog.objects.filter(
                action_by=self.user,
                action_type=AuditLog.ActionType.USER_ACTION,
            ).exists()
        )

    def test_official_cannot_reject_resident_from_another_barangay(self):
        official_barangay = Barangay.objects.create(name="Official Barangay")
        other_barangay = Barangay.objects.create(name="Other Barangay")
        target_user = User.objects.create_user(
            username="other_barangay_pending",
            password="password123",
            email="other-pending@example.com",
            role=User.Role.RESIDENT,
            barangay=other_barangay,
        )
        resident = Resident.objects.create(
            user=target_user,
            full_name="Resident From Other Barangay",
            birth_date="2000-01-01",
        )

        self.user.role = User.Role.ADMIN
        self.user.barangay = official_barangay
        self.user.save()
        self.client.force_authenticate(user=self.user)

        url = reverse("reject_resident", args=[resident.pk])
        response = self.client.delete(
            url,
            {"rejection_reason": "Test rejection reason."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(User.objects.filter(pk=target_user.pk).exists())

    def test_official_cannot_verify_resident_from_another_barangay(self):
        official_barangay = Barangay.objects.create(name="Verification Official Barangay")
        other_barangay = Barangay.objects.create(name="Verification Other Barangay")
        target_user = User.objects.create_user(
            username="other_barangay_unverified",
            password="password123",
            email="other-unverified@example.com",
            role=User.Role.RESIDENT,
            barangay=other_barangay,
        )
        resident = Resident.objects.create(
            user=target_user,
            full_name="Unverified Resident From Other Barangay",
            birth_date="2000-01-01",
        )

        self.user.role = User.Role.ADMIN
        self.user.barangay = official_barangay
        self.user.save()
        self.client.force_authenticate(user=self.user)

        url = reverse("verify_resident", args=[resident.pk])
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        resident.refresh_from_db()
        self.assertFalse(resident.is_verified)

class ResidentEmailUpdateAPITests(APITestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(name="Resident Email Barangay")
        self.other_barangay = Barangay.objects.create(name="Other Email Barangay")

        self.admin = User.objects.create_user(
            username="resident_email_admin",
            email="resident-email-admin@example.com",
            password=None,
            role=User.Role.ADMIN,
            barangay=self.barangay,
        )
        self.resident_user = User.objects.create_user(
            username="offline_resident",
            email="",
            password=None,
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        self.resident = Resident.objects.create(
            user=self.resident_user,
            full_name="Offline Resident",
            birth_date="1990-01-15",
            is_verified=True,
        )

        self.other_resident_user = User.objects.create_user(
            username="other_barangay_resident",
            email="",
            password=None,
            role=User.Role.RESIDENT,
            barangay=self.other_barangay,
        )
        self.other_resident = Resident.objects.create(
            user=self.other_resident_user,
            full_name="Resident From Other Barangay",
            birth_date="1992-03-20",
            is_verified=True,
        )

        self.client.force_authenticate(user=self.admin)

    def test_official_can_add_email_to_local_resident_and_audit_it(self):
        response = self.client.patch(
            reverse("resident-detail", args=[self.resident.pk]),
            {"email": "offline.resident@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.resident_user.refresh_from_db()
        self.assertEqual(
            self.resident_user.email,
            "offline.resident@example.com",
        )

        audit_entry = AuditLog.objects.get(
            action_by=self.admin,
            action_type=AuditLog.ActionType.USER_ACTION,
        )
        self.assertIn(str(self.resident.pk), audit_entry.description)
        self.assertNotIn(
            "offline.resident@example.com",
            audit_entry.description,
        )

    def test_official_cannot_add_email_to_resident_from_another_barangay(self):
        response = self.client.patch(
            reverse("resident-detail", args=[self.other_resident.pk]),
            {"email": "foreign.resident@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.other_resident_user.refresh_from_db()
        self.assertEqual(self.other_resident_user.email, "")

    def test_official_cannot_assign_email_already_used_by_another_account(self):
        User.objects.create_user(
            username="existing_email_owner",
            email="already.used@example.com",
            password="StrongTestPassword123!",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )

        response = self.client.patch(
            reverse("resident-detail", args=[self.resident.pk]),
            {"email": "ALREADY.USED@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.resident_user.refresh_from_db()
        self.assertEqual(self.resident_user.email, "")

    def test_password_reset_is_not_sent_when_email_is_shared(self):
        from django.core import mail

        shared_email = "shared.resident@example.com"
        self.resident_user.email = shared_email
        self.resident_user.save(update_fields=["email"])

        User.objects.create_user(
            username="shared_email_resident",
            email=shared_email,
            password=None,
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )

        self.client.force_authenticate(user=None)
        response = self.client.post(
            reverse("password_reset_request"),
            {"email": shared_email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_resident_cannot_use_directory_endpoint_to_set_email(self):
        self.client.force_authenticate(user=self.resident_user)

        response = self.client.patch(
            reverse("resident-detail", args=[self.resident.pk]),
            {"email": "resident-chosen@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.resident_user.refresh_from_db()
        self.assertEqual(self.resident_user.email, "")

class BarangayBrandingAPITests(APITestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(name="Barangay Branding Test")
        self.admin = User.objects.create_user(
            username="branding_admin",
            email="branding-admin@example.com",
            password="StrongTestPassword123!",
            role=User.Role.ADMIN,
            barangay=self.barangay,
        )
        self.client.force_authenticate(user=self.admin)
        self.detail_url = reverse(
            "barangay-detail",
            args=[self.barangay.pk],
        )

    def test_detail_returns_default_primary_color(self):
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["primary_color"], "#082B66")

    def test_official_can_update_primary_color(self):
        response = self.client.patch(
            self.detail_url,
            {"primary_color": "#C70039"},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.barangay.refresh_from_db()
        self.assertEqual(self.barangay.primary_color, "#C70039")

    def test_invalid_primary_color_is_rejected(self):
        response = self.client.patch(
            self.detail_url,
            {"primary_color": "not-a-color"},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("primary_color", response.data)

    def test_official_cannot_update_another_barangay_color(self):
        other_barangay = Barangay.objects.create(
            name="Another Branding Test Barangay"
        )
        other_url = reverse(
            "barangay-detail",
            args=[other_barangay.pk],
        )

        response = self.client.patch(
            other_url,
            {"primary_color": "#C70039"},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        other_barangay.refresh_from_db()
        self.assertEqual(other_barangay.primary_color, "#082B66")
        
class SeedBarangaysCommandTests(TestCase):
    def test_seed_barangays_is_idempotent_and_provisions_three_tenants(self):
        call_command("seed_barangays")
        call_command("seed_barangays")

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