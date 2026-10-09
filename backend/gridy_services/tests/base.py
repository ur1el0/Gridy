from rest_framework.test import APITestCase
from gridy_auth.models import Resident, User


class ServiceAPIBaseTestCase(APITestCase):
    def setUp(self):
        # Create an official (admin)
        self.official = User.objects.create_user(
            username="official_test",
            password="SecurePassword123!",
            email="admin@example.com",
            role=User.Role.ADMIN
        )
        # Create a verified resident
        self.resident = User.objects.create_user(
            username="resident_test",
            password="SecurePassword123!",
            email="resident@example.com",
            role=User.Role.RESIDENT
        )
        Resident.objects.create(
            user=self.resident,
            full_name="Resident Test",
            birth_date="1995-05-15",
            is_verified=True
        )
