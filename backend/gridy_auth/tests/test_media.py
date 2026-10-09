from io import BytesIO, StringIO
from unittest import skipUnless
from unittest.mock import patch

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.files.base import ContentFile
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from PIL import Image
from rest_framework import status

from gridy_auth.models import Barangay, Resident, User
from gridy_auth.serializers import ResidentSerializer
from .base import IsolatedAuthAPITestCase


class ResidentPrivateMediaAPITests(IsolatedAuthAPITestCase):
    def setUp(self):
        self.barangay = Barangay.objects.create(name="Private Media Barangay")
        self.other_barangay = Barangay.objects.create(name="Foreign Media Barangay")
        self.resident_user = User.objects.create_user(
            username="private_media_resident",
            password=None,
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        self.resident = Resident.objects.create(
            user=self.resident_user,
            full_name="Private Media Resident",
            birth_date="1990-01-01",
            philsys_id_photo="resident_ids/private-test.png",
        )
        image_data = BytesIO()
        Image.new("RGB", (1, 1)).save(image_data, format="PNG")
        self.test_image_bytes = image_data.getvalue()
        self.other_resident_user = User.objects.create_user(
            username="other_private_media_resident",
            password=None,
            role=User.Role.RESIDENT,
            barangay=self.barangay,
        )
        self.other_resident = Resident.objects.create(
            user=self.other_resident_user,
            full_name="Other Private Media Resident",
            birth_date="1991-01-01",
            philsys_id_photo="resident_ids/other-test.png",
        )
        self.admin = User.objects.create_user(
            username="private_media_admin",
            password=None,
            role=User.Role.ADMIN,
            barangay=self.barangay,
        )
        self.foreign_admin = User.objects.create_user(
            username="foreign_private_media_admin",
            password=None,
            role=User.Role.ADMIN,
            barangay=self.other_barangay,
        )

    def media_url(self, resident=None, field_name="philsys_id_photo"):
        return reverse(
            "resident_private_media",
            kwargs={
                "resident_id": (resident or self.resident).pk,
                "field_name": field_name,
            },
        )

    def get_media_as(self, user, resident=None, field_name="philsys_id_photo"):
        self.client.force_authenticate(user=user)
        with patch(
            "gridy_auth.views.resident_media.ResidentPrivateMediaView._open_media",
            return_value=ContentFile(self.test_image_bytes, name="private-test.png"),
        ):
            return self.client.get(self.media_url(resident, field_name))

    def test_resident_can_access_own_private_media(self):
        response = self.get_media_as(self.resident_user)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "image/png")
        self.assertEqual(response["Cache-Control"], "private, no-store, max-age=0")
        self.assertEqual(response["Content-Disposition"], "inline")
        self.assertEqual(
            b"".join(response.streaming_content),
            self.test_image_bytes,
        )

    def test_inline_media_type_comes_from_image_content_not_filename(self):
        self.resident.philsys_id_photo = "resident_ids/untrusted.html"
        self.resident.save(update_fields=["philsys_id_photo"])

        response = self.get_media_as(self.resident_user)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "image/png")
        self.assertEqual(response["X-Content-Type-Options"], "nosniff")

    def test_invalid_image_content_is_not_served_inline(self):
        self.client.force_authenticate(user=self.resident_user)
        with patch(
            "gridy_auth.views.resident_media.ResidentPrivateMediaView._open_media",
            return_value=ContentFile(b"not an image", name="private-test.png"),
        ):
            response = self.client.get(self.media_url())

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_same_barangay_official_can_access_resident_private_media(self):
        response = self.get_media_as(self.admin)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_resident_cannot_access_another_residents_private_media(self):
        response = self.get_media_as(
            self.other_resident_user,
            resident=self.resident,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_official_cannot_access_private_media_from_another_barangay(self):
        response = self.get_media_as(
            self.foreign_admin,
            resident=self.resident,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unapproved_field_names_are_not_served(self):
        response = self.get_media_as(
            self.admin,
            field_name="philsys_id_number",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_field_official_cannot_access_private_media(self):
        field_official = User.objects.create_user(
            username="private_media_field_official",
            password=None,
            role=User.Role.FIELD_OFFICIAL,
            barangay=self.barangay,
        )

        response = self.get_media_as(field_official)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_request_cannot_access_private_media(self):
        response = self.client.get(self.media_url())

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_media_is_not_opened(self):
        self.resident.philsys_id_photo = ""
        self.resident.save(update_fields=["philsys_id_photo"])
        self.client.force_authenticate(user=self.admin)

        with patch(
            "gridy_auth.views.resident_media.ResidentPrivateMediaView._open_media"
        ) as open_media:
            response = self.client.get(self.media_url())

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        open_media.assert_not_called()

    def test_resident_serializer_returns_authorized_endpoint_not_storage_url(self):
        data = ResidentSerializer(self.resident).data

        self.assertEqual(
            data["philsys_id_photo"],
            self.media_url().removeprefix("/api/v1/"),
        )

    def test_legacy_media_route_never_serves_resident_evidence(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/media/resident_ids/private-test.png")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@skipUnless(
    bool(getattr(settings, "CLOUDINARY_STORAGE", None)),
    "Cloudinary storage is not configured in this environment.",
)
class ResidentAwareCloudinaryStorageTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        from config.private_media_storage import ResidentAwareCloudinaryStorage

        cls.storage_class = ResidentAwareCloudinaryStorage

    def setUp(self):
        self.storage = self.storage_class()

    def test_new_resident_upload_uses_authenticated_delivery_and_opaque_id(self):
        with patch(
            "config.private_media_storage.cloudinary.uploader.upload",
            return_value={"public_id": "media/resident_ids/random-id"},
        ) as upload:
            self.storage._upload(
                "media/resident_ids/original_resident_filename.png",
                ContentFile(b"test image"),
            )

        upload_options = upload.call_args.kwargs
        self.assertEqual(upload_options["type"], "authenticated")
        self.assertTrue(
            upload_options["public_id"].startswith("media/resident_ids/")
        )
        self.assertNotIn("original_resident_filename", upload_options["public_id"])

    def test_private_read_builds_a_signed_authenticated_url(self):
        with patch.object(
            self.storage,
            "_download",
            return_value=ContentFile(b"test image"),
        ) as download:
            self.storage.open_private_resident_media(
                "media/resident_ids/random-id"
            )

        url = download.call_args.args[0]
        self.assertIn("/image/authenticated/", url)
        self.assertIn("/s--", url)

    def test_storage_does_not_expose_private_cloudinary_urls(self):
        with self.assertRaisesMessage(
            ImproperlyConfigured,
            "Resident evidence must be served through the authorized media endpoint.",
        ):
            self.storage.url("media/resident_ids/random-id")


class SecureResidentMediaCommandTests(TestCase):
    def setUp(self):
        barangay = Barangay.objects.create(name="Media Command Barangay")
        user = User.objects.create_user(
            username="media_command_resident",
            password=None,
            role=User.Role.RESIDENT,
            barangay=barangay,
        )
        Resident.objects.create(
            user=user,
            full_name="Media Command Resident",
            birth_date="1990-01-01",
            philsys_id_photo="media/resident_ids/asset-id",
        )

    def test_cloudinary_conversion_defaults_to_dry_run(self):
        output = StringIO()
        with patch.object(
            settings,
            "CLOUDINARY_STORAGE",
            {"CLOUD_NAME": "test", "API_KEY": "test", "API_SECRET": "test"},
            create=True,
        ), patch("cloudinary.uploader.rename") as rename:
            call_command("secure_resident_media", stdout=output)

        self.assertIn(
            "Dry run: found 1 unique resident evidence references in the database.",
            output.getvalue(),
        )
        self.assertIn("No Cloudinary assets were checked or changed.", output.getvalue())
        rename.assert_not_called()

    def test_apply_converts_public_asset_and_invalidates_old_delivery_url(self):
        from cloudinary.exceptions import NotFound

        output = StringIO()
        with patch.object(
            settings,
            "CLOUDINARY_STORAGE",
            {"CLOUD_NAME": "test", "API_KEY": "test", "API_SECRET": "test"},
            create=True,
        ), patch("cloudinary.api.resource", side_effect=NotFound("missing")), patch(
            "cloudinary.uploader.rename"
        ) as rename:
            call_command("secure_resident_media", "--apply", stdout=output)

        rename.assert_called_once_with(
            "media/resident_ids/asset-id",
            "media/resident_ids/asset-id",
            resource_type="image",
            type="upload",
            to_type="authenticated",
            invalidate=True,
        )
        self.assertIn("Converted 1 assets", output.getvalue())

    def test_apply_skips_asset_already_authenticated(self):
        output = StringIO()
        with patch.object(
            settings,
            "CLOUDINARY_STORAGE",
            {"CLOUD_NAME": "test", "API_KEY": "test", "API_SECRET": "test"},
            create=True,
        ), patch("cloudinary.api.resource", return_value={"public_id": "asset-id"}), patch(
            "cloudinary.uploader.rename"
        ) as rename:
            call_command("secure_resident_media", "--apply", stdout=output)

        rename.assert_not_called()
        self.assertIn("1 were already authenticated", output.getvalue())
