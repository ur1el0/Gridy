from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from gridy_auth.models import Resident


class Command(BaseCommand):
    help = "Convert existing Cloudinary resident evidence to authenticated delivery."

    PRIVATE_FIELDS = (
        "philsys_id_photo",
        "secondary_id_photo",
        "utility_billing_photo",
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Convert referenced assets and invalidate their old public CDN URLs.",
        )

    def handle(self, *args, **options):
        if not getattr(settings, "CLOUDINARY_STORAGE", None):
            raise CommandError("Cloudinary storage is not configured.")

        asset_ids = set()
        for field_name in self.PRIVATE_FIELDS:
            asset_ids.update(
                name
                for name in Resident.objects.values_list(field_name, flat=True)
                if name
            )

        if not asset_ids:
            self.stdout.write("No resident evidence assets were found.")
            return

        if not options["apply"]:
            self.stdout.write(
                f"Dry run: found {len(asset_ids)} unique resident evidence references in the database. "
                "No Cloudinary assets were checked or changed. "
                "Run again with --apply to check and convert public assets."
            )
            return

        import cloudinary.api
        import cloudinary.uploader
        from cloudinary.exceptions import NotFound

        migrated = 0
        already_private = 0
        try:
            for public_id in asset_ids:
                try:
                    cloudinary.api.resource(
                        public_id,
                        resource_type="image",
                        type="authenticated",
                    )
                    already_private += 1
                except NotFound:
                    cloudinary.uploader.rename(
                        public_id,
                        public_id,
                        resource_type="image",
                        type="upload",
                        to_type="authenticated",
                        invalidate=True,
                    )
                    migrated += 1
        except Exception as error:
            raise CommandError(
                "Resident evidence conversion stopped. Check Cloudinary credentials and "
                "the Cloudinary asset state before rerunning."
            ) from error

        self.stdout.write(
            self.style.SUCCESS(
                f"Converted {migrated} assets; {already_private} were already authenticated."
            )
        )
