from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from gridy_auth.models import Barangay, User
from gridy_communications.models import FAQ


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
