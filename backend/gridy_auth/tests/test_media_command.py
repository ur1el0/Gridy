from io import StringIO
from unittest.mock import patch

from django.conf import settings
from django.core.management import call_command
from django.test import TestCase

from gridy_auth.models import Barangay, Resident, User


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
