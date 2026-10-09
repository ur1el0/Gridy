import logging
from pathlib import Path
import firebase_admin
from firebase_admin import credentials
from django.apps import AppConfig
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)

class GridyCommunicationsConfig(AppConfig):
    name = 'gridy_communications'

    def ready(self):
        if not firebase_admin._apps:
            key_path = settings.FIREBASE_SERVICE_ACCOUNT_JSON_PATH
            if not key_path or not Path(key_path).is_file():
                logger.warning(
                    "Firebase credentials are not configured; push notifications are disabled."
                )
                return

            try:
                firebase_admin.initialize_app(credentials.Certificate(key_path))
            except Exception as exc:
                logger.exception("Firebase Admin SDK initialization failed.")
                if not settings.DEBUG and not settings.IS_TESTING:
                    raise ImproperlyConfigured(
                        'Production push notifications require valid '
                        'FIREBASE_SERVICE_ACCOUNT_JSON_PATH credentials.'
                    ) from exc
