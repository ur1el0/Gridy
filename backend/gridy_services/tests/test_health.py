from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class SystemHealthAPITests(APITestCase):
    def test_health_check_endpoint_success(self):
        url = reverse('health_check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "healthy")
        self.assertIn("database", response.data["services"])
        self.assertIn("cache", response.data["services"])
        self.assertEqual(response.data["services"]["database"]["status"], "healthy")
        self.assertEqual(response.data["services"]["cache"]["status"], "healthy")

    @override_settings(
        CORS_ALLOWED_ORIGINS=["https://app.example.gov.ph"],
        CORS_ALLOW_CREDENTIALS=True,
    )
    def test_preflight_allows_configured_origin_with_credentials(self):
        origin = "https://app.example.gov.ph"
        response = self.client.options(
            reverse("health_check"),
            HTTP_ORIGIN=origin,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Access-Control-Allow-Origin"], origin)
        self.assertEqual(
            response["Access-Control-Allow-Credentials"],
            "true",
        )

    @override_settings(
        CORS_ALLOWED_ORIGINS=["https://app.example.gov.ph"],
        CORS_ALLOW_CREDENTIALS=True,
    )
    def test_preflight_omits_cors_headers_for_unlisted_origin(self):
        response = self.client.options(
            reverse("health_check"),
            HTTP_ORIGIN="https://unlisted.example.net",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        )

        self.assertNotIn("Access-Control-Allow-Origin", response)
        self.assertNotIn("Access-Control-Allow-Credentials", response)
