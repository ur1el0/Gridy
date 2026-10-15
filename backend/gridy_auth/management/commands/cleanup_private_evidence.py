from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from gridy_auth.lifecycle import attempt_private_media_cleanup_safely
from gridy_auth.models import PrivateMediaCleanup


class Command(BaseCommand):
    help = "Retry deletion of encrypted resident private-evidence cleanup records."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=100,
            help="Maximum due cleanup records to process (default: 100).",
        )

    def handle(self, *args, **options):
        limit = options["limit"]
        if limit < 1:
            raise CommandError("--limit must be a positive integer.")

        due_ids = list(
            PrivateMediaCleanup.objects.filter(next_attempt_at__lte=timezone.now())
            .order_by("next_attempt_at", "created_at", "pk")
            .values_list("pk", flat=True)[:limit]
        )
        results = {"deleted": 0, "retry": 0, "deferred": 0, "missing": 0}
        for cleanup_id in due_ids:
            result = attempt_private_media_cleanup_safely(cleanup_id)
            results[result] = results.get(result, 0) + 1

        self.stdout.write(
            "Private evidence cleanup: "
            f"processed={len(due_ids)} deleted={results['deleted']} "
            f"retry_pending={results['retry']}"
        )
