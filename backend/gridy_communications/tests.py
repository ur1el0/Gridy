from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from gridy_auth.models import User
from .models import Announcement


# Create your tests here.


class AnnouncementAPITests(APITestCase):
    def setUp(self):
        # Create a mock admin user to write announcements
        self.admin = User.objects._create_user(
            username="admin_test",
            password="SecurePassword123!",
            email="admin@example.com",
            role=User.Role.ADMIN
        )
        self.client.force_login(self.admin)
        self.url = reverse('announcement-list')

    def test_announcement_query_ordering(self):
        # Create a regular (non-pinned) announcement
        ann1 = Announcement.objects.create(
            title="Regular Announcement 1",
            content="Content 1",
            is_pinned = False,
            created_by = self.admin
        )
        # Create a pinned announcement (should appear first)
        ann2 = Announcement.objects.create(
            title="Pinned Announcement 2",
            content="Content 2",
            is_pinned = True,
            created_by = self.admin
        )
        # Create another regular announcement (should appear after ann1)
        ann3 = Announcement.objects.create(
            title="Regular Announcement 3",
            content="Content 3",
            is_pinned = False,
            created_by = self.admin
        )

        response = self.client.get(self.url)
        # Extract the results array from the paginated response
        data = response.json().get('results', response.json())

        # 1. Check HTTP Status Code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 2. Check the order of announcements
        # Pinned should be first, then the others by creation time (newest first)
        expected_order = [ann2.id, ann3.id, ann1.id]
        actual_order = [item['id'] for item in data]
        self.assertEqual(actual_order, expected_order, "Announcements are not ordered correctly")

        # 3. Check that pinned items are correctly identified
        pinned_items = [item for item in data if item['is_pinned']]
        regular_items = [item for item in data if not item['is_pinned']]

        self.assertEqual(len(pinned_items), 1, "Should be exactly one pinned announcement")
        self.assertEqual(pinned_items[0]['id'], ann2.id, "Pinned announcement is not the correct one")
        self.assertEqual(pinned_items[0]['title'], "Pinned Announcement 2")

        self.assertEqual(len(regular_items), 2, "Should be two regular announcements")
        self.assertEqual(regular_items[0]['id'], ann3.id, "Regular announcements are not ordered correctly by time")
