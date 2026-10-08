from django.conf import settings
from django.core.management.base import CommandError
from django.db import connection


LOCAL_DATABASE_HOSTS = {"", "localhost", "127.0.0.1", "::1", "db"}


def require_local_demo_database(*, confirmed):
    if not confirmed:
        raise CommandError(
            "Pass --confirm-demo-only only for a local presentation database."
        )
    if not settings.DEBUG:
        raise CommandError("Demo data seeding is disabled when DEBUG is False.")

    host = str(connection.settings_dict.get("HOST") or "").strip().lower()
    if host not in LOCAL_DATABASE_HOSTS:
        raise CommandError(
            "Demo data seeding is restricted to local database hosts."
        )
    if connection.vendor not in {"sqlite", "postgresql"}:
        raise CommandError(
            "Demo data seeding supports local SQLite or PostgreSQL only."
        )
