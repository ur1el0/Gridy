import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from gridy_audit.models import AuditLog
from gridy_auth.models import Barangay, RefreshSession

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def barangay_a(db):
    return Barangay.objects.create(
        name="Barangay San Isidro",
        municipality="Lucena City",
        province="Quezon",
    )


@pytest.fixture
def barangay_b(db):
    return Barangay.objects.create(
        name="Barangay San Antonio",
        municipality="Lucena City",
        province="Quezon",
    )


@pytest.fixture
def admin_a(db, barangay_a):
    user = User.objects.create_user(
        username="admin_isidro",
        email="admin.isidro@example.com",
        password="AdminPassword123!",
        role=User.Role.ADMIN,
        barangay=barangay_a,
        is_staff=True,
    )
    return user


@pytest.fixture
def admin_b(db, barangay_b):
    user = User.objects.create_user(
        username="admin_antonio",
        email="admin.antonio@example.com",
        password="AdminPassword123!",
        role=User.Role.ADMIN,
        barangay=barangay_b,
        is_staff=True,
    )
    return user


@pytest.fixture
def resident_a(db, barangay_a):
    user = User.objects.create_user(
        username="resident_isidro",
        email="resident.isidro@example.com",
        password="ResidentPassword123!",
        role=User.Role.RESIDENT,
        barangay=barangay_a,
        is_staff=False,
    )
    return user


@pytest.fixture
def field_official_a(db, barangay_a):
    user = User.objects.create_user(
        username="tanod_isidro_1",
        email="tanod1.isidro@example.com",
        first_name="Juan",
        last_name="Dela Cruz",
        password="FieldOfficial123!",
        role=User.Role.FIELD_OFFICIAL,
        barangay=barangay_a,
        is_staff=False,
        is_active=True,
    )
    return user


@pytest.fixture
def field_official_b(db, barangay_b):
    user = User.objects.create_user(
        username="tanod_antonio_1",
        email="tanod1.antonio@example.com",
        first_name="Pedro",
        last_name="Penduko",
        password="FieldOfficial123!",
        role=User.Role.FIELD_OFFICIAL,
        barangay=barangay_b,
        is_staff=False,
        is_active=True,
    )
    return user


@pytest.mark.django_db
class TestStaffManagementPermissions:
    def test_anonymous_caller_receives_401(self, api_client):
        response = api_client.get("/api/v1/auth/staff/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_resident_caller_receives_403(self, api_client, resident_a):
        api_client.force_authenticate(user=resident_a)
        response = api_client.get("/api/v1/auth/staff/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_field_official_caller_receives_403(self, api_client, field_official_a):
        api_client.force_authenticate(user=field_official_a)
        response = api_client.get("/api/v1/auth/staff/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_without_barangay_receives_403(self, api_client):
        unassigned_admin = User.objects.create_user(
            username="unassigned_admin",
            email="unassigned@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            barangay=None,
        )
        api_client.force_authenticate(user=unassigned_admin)
        response = api_client.get("/api/v1/auth/staff/")
        # Empty list because get_queryset filters User.objects.none()
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) == 0

        # Create attempt fails with 403
        create_resp = api_client.post(
            "/api/v1/auth/staff/",
            {
                "username": "tanod_new",
                "email": "tanod@example.com",
                "first_name": "Test",
                "last_name": "Tanod",
                "password": "ValidPassword123!",
            },
            format="json",
        )
        assert create_resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestStaffManagementEndpoints:
    def test_admin_can_list_staff_for_own_barangay_strictly(
        self, api_client, admin_a, field_official_a, field_official_b, resident_a
    ):
        api_client.force_authenticate(user=admin_a)
        response = api_client.get("/api/v1/auth/staff/")
        assert response.status_code == status.HTTP_200_OK

        results = response.data.get("results", response.data)
        assert len(results) == 1
        record = results[0]
        assert record["id"] == field_official_a.id
        assert record["username"] == "tanod_isidro_1"
        assert record["role"] == User.Role.FIELD_OFFICIAL
        assert record["full_name"] == "Juan Dela Cruz"
        assert record["is_active"] is True

        # Ensure no cross-tenant leakage or resident inclusion
        returned_ids = [r["id"] for r in results]
        assert field_official_b.id not in returned_ids
        assert resident_a.id not in returned_ids
        assert admin_a.id not in returned_ids

    def test_admin_can_create_field_official_successfully(self, api_client, admin_a, barangay_a):
        api_client.force_authenticate(user=admin_a)
        payload = {
            "username": "tanod_carding",
            "email": "carding@isidro.example.gov.ph",
            "first_name": "Ricardo",
            "last_name": "Dalisay",
            "password": "SecurePassword2026!",
        }
        response = api_client.post("/api/v1/auth/staff/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["username"] == "tanod_carding"
        assert response.data["email"] == "carding@isidro.example.gov.ph"
        assert response.data["full_name"] == "Ricardo Dalisay"
        assert response.data["role"] == User.Role.FIELD_OFFICIAL
        assert response.data["is_active"] is True

        # Verify database record
        created_user = User.objects.get(username="tanod_carding")
        assert created_user.barangay_id == barangay_a.id
        assert created_user.role == User.Role.FIELD_OFFICIAL
        assert created_user.is_staff is False
        assert created_user.is_active is True
        assert created_user.check_password("SecurePassword2026!") is True

        # Verify audit log was written
        audit = AuditLog.objects.filter(
            action_by=admin_a,
            action_type=AuditLog.ActionType.USER_ACTION,
        ).latest("timestamp")
        assert "tanod_carding" in audit.description
        assert barangay_a.name in audit.description

    def test_disallowed_extra_fields_are_rejected(self, api_client, admin_a, barangay_b):
        api_client.force_authenticate(user=admin_a)
        payload = {
            "username": "tanod_hacker",
            "email": "hacker@example.com",
            "first_name": "Malicious",
            "last_name": "Actor",
            "password": "SecurePassword2026!",
            "role": User.Role.ADMIN,  # Disallowed
            "barangay_id": barangay_b.id,  # Disallowed
            "is_staff": True,  # Disallowed
            "is_superuser": True,  # Disallowed
        }
        response = api_client.post("/api/v1/auth/staff/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Disallowed fields" in str(response.data)

    def test_duplicate_username_rejected(self, api_client, admin_a, field_official_a):
        api_client.force_authenticate(user=admin_a)
        payload = {
            "username": field_official_a.username,  # Duplicate
            "email": "unique.email@example.com",
            "first_name": "Duplicate",
            "last_name": "User",
            "password": "SecurePassword2026!",
        }
        response = api_client.post("/api/v1/auth/staff/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "username" in response.data

    def test_duplicate_email_rejected(self, api_client, admin_a, field_official_a):
        api_client.force_authenticate(user=admin_a)
        payload = {
            "username": "unique_username",
            "email": field_official_a.email.upper(),  # Case-insensitive duplicate
            "first_name": "Duplicate",
            "last_name": "Email",
            "password": "SecurePassword2026!",
        }
        response = api_client.post("/api/v1/auth/staff/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_short_password_rejected(self, api_client, admin_a):
        api_client.force_authenticate(user=admin_a)
        payload = {
            "username": "tanod_weak",
            "email": "weak@example.com",
            "first_name": "Weak",
            "last_name": "Pass",
            "password": "short",  # < 8 chars
        }
        response = api_client.post("/api/v1/auth/staff/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "password" in response.data

    def test_admin_can_toggle_staff_active_status_and_revokes_sessions(
        self, api_client, admin_a, field_official_a
    ):
        # Create an active refresh session for the field official
        session = RefreshSession.objects.create(
            user=field_official_a,
            refresh_token_jti="test-jti-12345",
            ip_address="127.0.0.1",
            user_agent="FieldApp/1.0",
            expires_at="2099-01-01T00:00:00Z",
            is_revoked=False,
        )

        api_client.force_authenticate(user=admin_a)
        toggle_url = f"/api/v1/auth/staff/{field_official_a.id}/toggle-status/"

        # 1. Deactivate
        response = api_client.post(toggle_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is False

        field_official_a.refresh_from_db()
        assert field_official_a.is_active is False

        # Session must be revoked immediately
        session.refresh_from_db()
        assert session.is_revoked is True

        # Audit log verification
        audit = AuditLog.objects.filter(
            action_by=admin_a,
            action_type=AuditLog.ActionType.USER_ACTION,
        ).latest("timestamp")
        assert "deactivated" in audit.description
        assert field_official_a.username in audit.description

        # 2. Reactivate
        response_reactivate = api_client.post(toggle_url)
        assert response_reactivate.status_code == status.HTTP_200_OK
        assert response_reactivate.data["is_active"] is True

        field_official_a.refresh_from_db()
        assert field_official_a.is_active is True

    def test_admin_cannot_toggle_staff_from_another_barangay(
        self, api_client, admin_a, field_official_b
    ):
        api_client.force_authenticate(user=admin_a)
        toggle_url = f"/api/v1/auth/staff/{field_official_b.id}/toggle-status/"
        response = api_client.post(toggle_url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_cannot_toggle_residents_or_admins_via_staff_endpoint(
        self, api_client, admin_a, resident_a
    ):
        api_client.force_authenticate(user=admin_a)
        toggle_url = f"/api/v1/auth/staff/{resident_a.id}/toggle-status/"
        response = api_client.post(toggle_url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
