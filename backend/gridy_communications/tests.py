from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from gridy_auth.models import Barangay, User
from .models import Announcement
from datetime import timedelta
from django.utils import timezone
from .models import ActivitySchedule

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
        data = response.json()
        
        # If paginated, extract 'results', otherwise use the raw list
        results = data.get('results', data) if isinstance(data, dict) else data

        # 1. Check HTTP Status Code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 2. Check the order of announcements
        # Pinned should be first, then the others by creation time (newest first)
        expected_order = [ann2.id, ann3.id, ann1.id]
        actual_order = [item['id'] for item in results]
        self.assertEqual(actual_order, expected_order, "Announcements are not ordered correctly")

        # 3. Check that pinned items are correctly identified
        pinned_items = [item for item in results if item['is_pinned']]
        regular_items = [item for item in results if not item['is_pinned']]

        self.assertEqual(len(pinned_items), 1, "Should be exactly one pinned announcement")
        self.assertEqual(pinned_items[0]['id'], ann2.id, "Pinned announcement is not the correct one")
        self.assertEqual(pinned_items[0]['title'], "Pinned Announcement 2")

        self.assertEqual(len(regular_items), 2, "Should be two regular announcements")
        self.assertEqual(regular_items[0]['id'], ann3.id, "Regular announcements are not ordered correctly by time")


class PublicAnnouncementAPITests(APITestCase):
    def test_public_feed_is_barangay_scoped_and_exposes_only_post_details(self):
        first_barangay = Barangay.objects.create(name="Public Announcement A")
        second_barangay = Barangay.objects.create(name="Public Announcement B")
        first_admin = User.objects.create_user(
            username="public_announcement_admin_a",
            password="SecurePassword123!",
            role=User.Role.ADMIN,
            barangay=first_barangay,
        )
        second_admin = User.objects.create_user(
            username="public_announcement_admin_b",
            password="SecurePassword123!",
            role=User.Role.ADMIN,
            barangay=second_barangay,
        )
        announcement = Announcement.objects.create(
            title="Office schedule",
            content="The barangay hall opens at 8 AM.",
            created_by=first_admin,
        )
        Announcement.objects.create(
            title="Announcement in another tenant",
            content="This must not appear in the first feed.",
            created_by=second_admin,
        )

        response = self.client.get(
            reverse("public-announcements", args=[first_barangay.pk])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], announcement.pk)
        self.assertEqual(response.data[0]["title"], "Office schedule")
        self.assertNotIn("created_by", response.data[0])
        self.assertNotIn("image", response.data[0])

class ActivityScheduleAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects._create_user(
            username="admin_official",
            password="SecurePassword123!",
            email="admin_official@example.com",
            role=User.Role.ADMIN,
            is_active=True
        )
        self.resident = User.objects._create_user(
            username="resident_juan",
            password="SecurePassword123!",
            email="resident_juan@example.com",
            role=User.Role.RESIDENT,
            is_active=True
        )
        self.list_url = reverse('activity-list')

    def test_resident_can_view_activities_but_cannot_create(self):
        # 1. Admin creates an activity
        ActivitySchedule.objects.create(
            title="Clean-Up Drive",
            description="Community cleanup along Main Street.",
            event_datetime=timezone.now() + timedelta(days=2),
            location="Main Street Covered Court",
            created_by=self.admin
        )

        # 2. Resident logs in and lists activities -> 200 OK
        self.client.force_login(self.resident)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], "Clean-Up Drive")

        # 3. Resident attempts to schedule an activity -> 403 Forbidden
        payload = {
            "title": "Unauthorized Party",
            "description": "Resident trying to create official event.",
            "event_datetime": (timezone.now() + timedelta(days=1)).isoformat(),
            "location": "Plaza"
        }
        post_response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(post_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_official_can_create_and_delete_activity(self):
        self.client.force_login(self.admin)
        payload = {
            "title": "Barangay Assembly",
            "description": "Quarterly financial report and discussion.",
            "event_datetime": (timezone.now() + timedelta(days=5)).isoformat(),
            "location": "Barangay Hall"
        }
        create_res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        activity_id = create_res.json()['id']

        # Official deletes activity -> 204 No Content
        detail_url = reverse('activity-detail', kwargs={'pk': activity_id})
        delete_res = self.client.delete(detail_url)
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ActivitySchedule.objects.filter(id=activity_id).exists())
