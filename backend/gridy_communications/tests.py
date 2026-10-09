from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from datetime import timedelta
from django.utils import timezone
from gridy_auth.models import Barangay, User
from .models import ActivitySchedule, Announcement, EmergencyHotline, FAQ

# Create your tests here.


class AnnouncementAPITests(APITestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(name="Announcement Test Barangay")
        # Create a mock admin user to write announcements
        self.admin = User.objects._create_user(
            username="admin_test",
            password="SecurePassword123!",
            email="admin@example.com",
            role=User.Role.ADMIN,
            barangay=self.barangay,
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
        self.barangay = Barangay.objects.create(name="Activity Test Barangay")
        self.admin = User.objects._create_user(
            username="admin_official",
            password="SecurePassword123!",
            email="admin_official@example.com",
            role=User.Role.ADMIN,
            barangay=self.barangay,
            is_active=True
        )
        self.resident = User.objects._create_user(
            username="resident_juan",
            password="SecurePassword123!",
            email="resident_juan@example.com",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
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


class FAQAPITests(APITestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(name="Barangay Test")
        self.dilg_admin = User.objects.create_user(
            username="dilg_admin_faq",
            password="SecurePassword123!",
            email="dilg_admin@example.com",
            role=User.Role.DILG_ADMIN,
            is_active=True,
        )
        self.barangay_admin = User.objects.create_user(
            username="brgy_admin_faq",
            password="SecurePassword123!",
            email="brgy_admin@example.com",
            role=User.Role.ADMIN,
            barangay=self.barangay,
            is_active=True,
        )
        self.resident = User.objects.create_user(
            username="resident_faq",
            password="SecurePassword123!",
            email="resident_faq@example.com",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
            is_active=True,
        )
        self.faq = FAQ.objects.create(
            question="How do I get a clearance?",
            answer="Submit a request through the Citizen Portal.",
            order=1,
        )
        self.list_url = reverse("faq-list")
        self.detail_url = reverse("faq-detail", kwargs={"pk": self.faq.pk})

    def test_authenticated_users_can_list_and_retrieve_faqs(self):
        for user in [self.resident, self.barangay_admin, self.dilg_admin]:
            self.client.force_login(user)
            list_res = self.client.get(self.list_url)
            self.assertEqual(list_res.status_code, status.HTTP_200_OK)
            results = list_res.data.get("results", list_res.data) if isinstance(list_res.data, dict) else list_res.data
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0]["id"], self.faq.pk)

            retrieve_res = self.client.get(self.detail_url)
            self.assertEqual(retrieve_res.status_code, status.HTTP_200_OK)
            self.assertEqual(retrieve_res.data["question"], "How do I get a clearance?")

    def test_unauthenticated_user_cannot_read_faqs(self):
        list_res = self.client.get(self.list_url)
        self.assertEqual(list_res.status_code, status.HTTP_401_UNAUTHORIZED)

        retrieve_res = self.client.get(self.detail_url)
        self.assertEqual(retrieve_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_barangay_admin_cannot_create_update_or_delete_faq(self):
        self.client.force_login(self.barangay_admin)

        post_res = self.client.post(
            self.list_url,
            {"question": "New FAQ?", "answer": "Answer.", "order": 2},
            format="json",
        )
        self.assertEqual(post_res.status_code, status.HTTP_403_FORBIDDEN)

        patch_res = self.client.patch(
            self.detail_url,
            {"question": "Modified Question?"},
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_403_FORBIDDEN)

        delete_res = self.client.delete(self.detail_url)
        self.assertEqual(delete_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(FAQ.objects.filter(pk=self.faq.pk).exists())

    def test_dilg_admin_can_create_update_and_delete_faq(self):
        self.client.force_login(self.dilg_admin)

        post_res = self.client.post(
            self.list_url,
            {"question": "What is Gridy?", "answer": "Gridy is a barangay management system.", "order": 2},
            format="json",
        )
        self.assertEqual(post_res.status_code, status.HTTP_201_CREATED)
        new_faq_id = post_res.data["id"]

        new_detail_url = reverse("faq-detail", kwargs={"pk": new_faq_id})
        patch_res = self.client.patch(
            new_detail_url,
            {"answer": "Updated Gridy explanation."},
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["answer"], "Updated Gridy explanation.")

        delete_res = self.client.delete(new_detail_url)
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(FAQ.objects.filter(pk=new_faq_id).exists())


class UnassignedCommunicationsAPITests(APITestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(name="Barangay Guadalupe")
        self.assigned_admin = User.objects.create_user(
            username="assigned_admin",
            password="SecurePassword123!",
            email="assigned_admin@example.com",
            role=User.Role.ADMIN,
            barangay=self.barangay,
            is_active=True,
        )
        self.assigned_resident = User.objects.create_user(
            username="assigned_resident",
            password="SecurePassword123!",
            email="assigned_resident@example.com",
            role=User.Role.RESIDENT,
            barangay=self.barangay,
            is_active=True,
        )
        self.unassigned_admin = User.objects.create_user(
            username="unassigned_admin",
            password="SecurePassword123!",
            email="unassigned_admin@example.com",
            role=User.Role.ADMIN,
            barangay=None,
            is_active=True,
        )
        self.unassigned_resident = User.objects.create_user(
            username="unassigned_resident",
            password="SecurePassword123!",
            email="unassigned_resident@example.com",
            role=User.Role.RESIDENT,
            barangay=None,
            is_active=True,
        )
        self.dilg_admin = User.objects.create_user(
            username="dilg_admin_comm",
            password="SecurePassword123!",
            email="dilg_admin_comm@example.com",
            role=User.Role.DILG_ADMIN,
            barangay=None,
            is_active=True,
        )
        # Fixture created by an assigned official
        self.assigned_announcement = Announcement.objects.create(
            title="Assigned Announcement",
            content="Content for Barangay Guadalupe",
            created_by=self.assigned_admin,
        )
        self.assigned_activity = ActivitySchedule.objects.create(
            title="Assigned Activity",
            description="Activity for Barangay Guadalupe",
            event_datetime=timezone.now() + timedelta(days=3),
            location="Barangay Court",
            created_by=self.assigned_admin,
        )
        self.assigned_hotline = EmergencyHotline.objects.create(
            name="Guadalupe Desk",
            number="123-4567",
            category=EmergencyHotline.Category.BARANGAY,
            created_by=self.assigned_admin,
        )
        # Fixture created directly with null-owner tenant (unassigned creator)
        self.null_announcement = Announcement.objects.create(
            title="Null Tenant Announcement",
            content="Orphaned content without a barangay",
            created_by=self.unassigned_admin,
        )
        self.null_activity = ActivitySchedule.objects.create(
            title="Null Tenant Activity",
            description="Orphaned activity without a barangay",
            event_datetime=timezone.now() + timedelta(days=4),
            location="Unassigned Court",
            created_by=self.unassigned_admin,
        )
        self.null_hotline = EmergencyHotline.objects.create(
            name="Null Desk",
            number="000-0000",
            category=EmergencyHotline.Category.OTHER,
            created_by=self.unassigned_admin,
        )

    def test_unassigned_non_dilg_users_receive_empty_communications_querysets(self):
        for unassigned_user in [self.unassigned_admin, self.unassigned_resident]:
            self.client.force_login(unassigned_user)

            for endpoint in ["announcement-list", "activity-list", "hotline-list"]:
                res = self.client.get(reverse(endpoint))
                self.assertEqual(res.status_code, status.HTTP_200_OK)
                results = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
                self.assertEqual(
                    len(results),
                    0,
                    f"Unassigned user {unassigned_user.username} received rows from {endpoint}",
                )

    def test_unassigned_admin_cannot_create_communications_records(self):
        self.client.force_login(self.unassigned_admin)

        # 1. Announcement create rejection
        ann_res = self.client.post(
            reverse("announcement-list"),
            {"title": "Blocked Announcement", "content": "Should fail"},
            format="json",
        )
        self.assertEqual(ann_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Announcement.objects.filter(title="Blocked Announcement").exists())

        # 2. Activity schedule create rejection
        act_res = self.client.post(
            reverse("activity-list"),
            {
                "title": "Blocked Activity",
                "description": "Should fail",
                "event_datetime": (timezone.now() + timedelta(days=1)).isoformat(),
                "location": "Nowhere",
            },
            format="json",
        )
        self.assertEqual(act_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(ActivitySchedule.objects.filter(title="Blocked Activity").exists())

        # 3. Emergency hotline create rejection
        hot_res = self.client.post(
            reverse("hotline-list"),
            {"name": "Blocked Hotline", "number": "999-9999", "category": "OTHER"},
            format="json",
        )
        self.assertEqual(hot_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(EmergencyHotline.objects.filter(name="Blocked Hotline").exists())

    def test_dilg_admin_retains_global_communications_reads(self):
        self.client.force_login(self.dilg_admin)

        ann_res = self.client.get(reverse("announcement-list"))
        self.assertEqual(ann_res.status_code, status.HTTP_200_OK)
        ann_results = ann_res.data.get("results", ann_res.data) if isinstance(ann_res.data, dict) else ann_res.data
        self.assertEqual(len(ann_results), 2)

        act_res = self.client.get(reverse("activity-list"))
        self.assertEqual(act_res.status_code, status.HTTP_200_OK)
        act_results = act_res.data.get("results", act_res.data) if isinstance(act_res.data, dict) else act_res.data
        self.assertEqual(len(act_results), 2)

        hot_res = self.client.get(reverse("hotline-list"))
        self.assertEqual(hot_res.status_code, status.HTTP_200_OK)
        hot_results = hot_res.data.get("results", hot_res.data) if isinstance(hot_res.data, dict) else hot_res.data
        self.assertEqual(len(hot_results), 2)

    def test_assigned_users_isolate_communications_to_own_barangay(self):
        other_barangay = Barangay.objects.create(name="Barangay Pinagkaisahan")
        other_admin = User.objects.create_user(
            username="other_admin",
            password="SecurePassword123!",
            email="other_admin@example.com",
            role=User.Role.ADMIN,
            barangay=other_barangay,
            is_active=True,
        )
        Announcement.objects.create(
            title="Other Barangay Announcement",
            content="Content for Pinagkaisahan",
            created_by=other_admin,
        )

        self.client.force_login(self.assigned_resident)
        res = self.client.get(reverse("announcement-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.assigned_announcement.pk)
