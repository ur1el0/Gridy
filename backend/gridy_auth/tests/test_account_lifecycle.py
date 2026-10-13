import uuid
from decimal import Decimal
from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from gridy_audit.models import AuditLog
from gridy_auth.models import Barangay, Resident, User, RefreshSession
from gridy_services.models import DocumentRequest
from .base import IsolatedAuthAPITestCase


class AccountLifecycleSecurityTests(IsolatedAuthAPITestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(name="Lifecycle Test Barangay")
        self.admin = User.objects.create_user(
            username="admin_official",
            email="admin@barangay.gov.ph",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            barangay=self.barangay,
        )
        self.resident_user = User.objects.create_user(
            username="active_resident",
            email="active.resident@example.com",
            password="ResidentPassword123!",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        self.resident = Resident.objects.create(
            user=self.resident_user,
            full_name="Active Resident",
            birth_date="1995-05-15",
            is_verified=True,
        )
        # Create an active refresh session
        self.session = RefreshSession.objects.create(
            user=self.resident_user,
            refresh_token_jti="fake-jti-for-testing",
            expires_at=timezone.now() + timezone.timedelta(days=7),
            ip_address="127.0.0.1",
            user_agent="TestAgent/1.0",
        )
        # Create an existing statutory DocumentRequest linked to the resident
        self.doc_request = DocumentRequest.objects.create(
            user=self.resident_user,
            barangay=self.barangay,
            document_type="Barangay Clearance",
            purpose="Employment",
            status=DocumentRequest.Status.READY_FOR_PICKUP,
            fee_amount=Decimal("50.00"),
            or_number="OR-2026-9999",
        )

    def test_directory_deletion_deactivates_user_revokes_sessions_preserves_records(self):
        """F-01: Administrative removal of resident from directory must deactivate user,
        revoke all active sessions, delete profile, and preserve historical treasury records."""
        self.client.force_authenticate(user=self.admin)
        url = reverse("resident-detail", args=[self.resident.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # 1. User account is deactivated
        self.resident_user.refresh_from_db()
        self.assertFalse(self.resident_user.is_active)

        # 2. Refresh sessions are deleted
        self.assertEqual(
            RefreshSession.objects.filter(user=self.resident_user).count(),
            0,
        )

        # 3. Resident profile is deleted
        self.assertFalse(
            Resident.objects.filter(id=self.resident.id).exists()
        )

        # 4. Historical document request is preserved and still linked
        self.doc_request.refresh_from_db()
        self.assertEqual(self.doc_request.user_id, self.resident_user.id)
        self.assertEqual(self.doc_request.fee_amount, Decimal("50.00"))
        self.assertEqual(self.doc_request.or_number, "OR-2026-9999")

        # 5. Subsequent login is rejected
        self.client.force_authenticate(user=None)
        login_url = reverse("auth_login")
        login_resp = self.client.post(
            login_url,
            {"username": "active_resident", "password": "ResidentPassword123!"},
            format="json",
        )
        self.assertIn(
            login_resp.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

        # 6. Audit log is durably recorded
        audit = AuditLog.objects.filter(
            action_by=self.admin,
            action_type=AuditLog.ActionType.USER_ACTION,
            description__contains="Removed resident account for Active Resident",
        ).first()
        self.assertIsNotNone(audit)

    def test_resident_erasure_deactivates_anonymizes_credentials_preserves_records(self):
        """F-03: Voluntary Right to Erasure must deactivate account, anonymize username/email,
        revoke sessions, delete profile, and preserve linked DocumentRequest records without CASCADE."""
        self.client.force_authenticate(user=self.resident_user)
        url = reverse("auth_me")
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # 1. User account is deactivated
        self.resident_user.refresh_from_db()
        self.assertFalse(self.resident_user.is_active)

        # 2. Credentials are anonymized and password made unusable
        self.assertTrue(self.resident_user.username.startswith("erased_"))
        self.assertTrue(self.resident_user.email.endswith("@erased.local"))
        self.assertFalse(self.resident_user.has_usable_password())

        # 3. Refresh sessions are deleted
        self.assertEqual(
            RefreshSession.objects.filter(user=self.resident_user).count(),
            0,
        )

        # 4. Profile is deleted
        self.assertFalse(
            Resident.objects.filter(id=self.resident.id).exists()
        )

        # 5. Document request is preserved and NOT deleted via CASCADE
        self.doc_request.refresh_from_db()
        self.assertEqual(self.doc_request.user_id, self.resident_user.id)
        self.assertEqual(self.doc_request.fee_amount, Decimal("50.00"))
        self.assertEqual(self.doc_request.or_number, "OR-2026-9999")

        # 6. Audit log entry recorded without exposing sensitive PII
        audit = AuditLog.objects.filter(
            action_type=AuditLog.ActionType.USER_ACTION,
            description__contains="Right to Erasure",
        ).first()
        self.assertIsNotNone(audit)
        self.assertNotIn("active_resident", audit.description)
        self.assertNotIn("active.resident@example.com", audit.description)
        self.assertIn(str(self.resident_user.id), audit.description)

    def test_login_rejects_deactivated_resident_accounts(self):
        """F-01: Resident accounts that are deactivated cannot obtain JWT tokens."""
        self.resident_user.is_active = False
        self.resident_user.save(update_fields=["is_active"])

        login_url = reverse("auth_login")
        resp = self.client.post(
            login_url,
            {"username": "active_resident", "password": "ResidentPassword123!"},
            format="json",
        )
        self.assertIn(
            resp.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_unverified_or_profile_less_user_cannot_create_document_request(self):
        """F-01: Document request creation strictly enforces that resident must have a verified profile."""
        unverified_user = User.objects.create_user(
            username="unverified_resident",
            password="ResidentPassword123!",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        Resident.objects.create(
            user=unverified_user,
            full_name="Unverified Person",
            birth_date="1999-01-01",
            is_verified=False,
        )

        self.client.force_authenticate(user=unverified_user)
        url = reverse("document-request-list")
        resp = self.client.post(
            url,
            {
                "document_type": "Barangay Clearance",
                "purpose": "Employment",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("verified", resp.data["detail"])

    def test_profile_less_active_user_cannot_create_document_request(self):
        """F-02: An active resident whose Resident profile has been deleted must not be able
        to create document requests. The view's profile guard must reject profile-less users."""
        profile_less_user = User.objects.create_user(
            username="profileless_resident",
            password="ResidentPassword123!",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
            is_active=True,
        )
        # No Resident profile created — simulates a profile that was deleted
        self.client.force_authenticate(user=profile_less_user)
        url = reverse("document-request-list")
        resp = self.client.post(
            url,
            {
                "document_type": "Barangay Clearance",
                "purpose": "Employment",
            },
            format="json",
        )
        self.assertIn(resp.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_login_rejects_active_resident_with_no_profile(self):
        """F-01 regression: An active resident account with no Resident profile must be
        rejected at login. Previously the `hasattr(...) and not ...is_verified` guard
        short-circuited when there was no profile, allowing profile-less login."""
        profile_less_user = User.objects.create_user(
            username="profileless_login",
            password="ResidentPassword123!",
            email="profileless@example.com",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
            is_active=True,
        )
        # No Resident profile created
        login_url = reverse("auth_login")
        resp = self.client.post(
            login_url,
            {"username": "profileless_login", "password": "ResidentPassword123!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("removed", resp.data["detail"])

    def test_proof_file_cleanup_succeeds_on_commit(self):
        """F-01/F-03: When a resident profile is deleted, attached proof files
        must be cleanly deleted from storage via the on_commit callback."""
        from unittest.mock import patch

        self.resident.philsys_id_photo = "resident_ids/test_philsys.jpg"
        self.resident.secondary_id_photo = "resident_ids/test_secondary.jpg"
        self.resident.utility_billing_photo = "resident_billings/test_billing.jpg"
        self.resident.save(update_fields=["philsys_id_photo", "secondary_id_photo", "utility_billing_photo"])

        storage = self.resident.philsys_id_photo.storage
        with patch.object(storage, "delete") as mock_delete:
            self.client.force_authenticate(user=self.admin)
            url = reverse("resident-detail", args=[self.resident.id])
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.delete(url)
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

            # Verify storage.delete was invoked for each proof file
            mock_delete.assert_any_call("resident_ids/test_philsys.jpg")
            mock_delete.assert_any_call("resident_ids/test_secondary.jpg")
            mock_delete.assert_any_call("resident_billings/test_billing.jpg")
            self.assertEqual(mock_delete.call_count, 3)

    def test_proof_file_cleanup_resilient_to_storage_failures(self):
        """F-01/F-03: Storage failures during proof-file deletion must be caught and swallowed;
        a storage error on one file must not fail the request or prevent deleting other files."""
        from unittest.mock import patch

        self.resident.philsys_id_photo = "resident_ids/test_fail.jpg"
        self.resident.secondary_id_photo = "resident_ids/test_ok.jpg"
        self.resident.save(update_fields=["philsys_id_photo", "secondary_id_photo"])

        storage = self.resident.philsys_id_photo.storage
        deleted_files = []

        def delete_side_effect(name):
            if "fail" in name:
                raise OSError("Simulated storage backend failure")
            deleted_files.append(name)

        with patch.object(storage, "delete", side_effect=delete_side_effect):
            self.client.force_authenticate(user=self.resident_user)
            url = reverse("auth_me")
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.delete(url)
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

            # Profile is deleted and user deactivated despite storage exception
            self.assertFalse(Resident.objects.filter(id=self.resident.id).exists())
            self.resident_user.refresh_from_db()
            self.assertFalse(self.resident_user.is_active)
            self.assertIn("resident_ids/test_ok.jpg", deleted_files)


    def test_inactive_guardian_cannot_be_used_for_minor_registration(self):
        """F-11 regression: If a guardian user has is_active=False, they must not be
        accepted as a guardian for a minor's registration."""
        from datetime import date, timedelta
        from unittest.mock import patch
        from gridy_auth.tests.test_registration import create_test_image_upload

        inactive_guardian = User.objects.create_user(
            username="inactive_guardian_user",
            password="GuardianPassword123!",
            email="inactive.guardian@example.com",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
            is_active=False,
        )
        Resident.objects.create(
            user=inactive_guardian,
            full_name="Inactive Guardian",
            birth_date="1980-01-01",
            is_verified=True,
        )

        minor_birth_date = (date.today() - timedelta(days=365 * 10)).isoformat()
        storage = Resident._meta.get_field("philsys_id_photo").storage
        with patch.object(storage, "save", side_effect=lambda name, content, max_length=None: name):
            resp = self.client.post(
                reverse("auth_register"),
                {
                    "username": "minor_with_inactive_guardian",
                    "email": "minor.inactive@example.com",
                    "password": "ValidPassword123!",
                    "full_name": "Minor With Inactive Guardian",
                    "birth_date": minor_birth_date,
                    "barangay_id": self.barangay.id,
                    "privacy_consent": True,
                    "privacy_consent_version": settings.PRIVACY_CONSENT_VERSION,
                    "philsys_id_photo": create_test_image_upload(),
                    "guardian_id": "inactive_guardian_user",
                },
                format="multipart",
            )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("guardian_id", resp.data)
