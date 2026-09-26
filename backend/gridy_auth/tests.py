from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from gridy_auth.models import User, Resident, Barangay
from django.core.management import call_command
from django.conf import settings
from gridy_services.models import DocumentRequest, QueueTicket
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
            "birth_date": "2000-01-01"
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username="new_resident").count(), 1)

    def test_user_registration_weak_password(self):
        url = reverse('auth_register')
        payload = {
            "username": "weak_resident",
            "email": "weak@example.com",
            "password": "123",
            "full_name": "Weak Password Test Resident",
            "birth_date": "2000-01-01"
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


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

        # Verify password auto-generation (birthdate format YYYYMMDD)
        self.assertTrue(user1.check_password("19951015"))
        
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


    def test_token_refresh_via_cookie_success(self):
        from gridy_auth.models import RefreshSession
        # 1. Login to establish cookie
        login_url = reverse('auth_login')
        login_payload = {
            "username": self.username,
            "password": self.password
        }
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
        # 1. Create a dummy pending resident
        dummy_user = User.objects.create_user(
            username="dummy_pending",
            password="password123",
            email="dummy@example.com",
            role=User.Role.RESIDENT
        )
        
        dummy_resident = Resident.objects.create(
            user=dummy_user,
            full_name="Dummy Pending",
            birth_date="2000-01-01"
        )
        
        # 2. Make our test user an Admin so they have permission
        self.user.role = User.Role.ADMIN
        self.user.save()
        self.client.force_authenticate(user=self.user)

        url = reverse('reject_resident', args=[dummy_resident.pk])
        
        # 3. Hit the endpoint
        response = self.client.delete(url)
        
        # 4. Verify the response is 204 No Content
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # 5. Verify the user is actually deleted from the database
        self.assertEqual(User.objects.filter(username="dummy_pending").count(), 0)

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