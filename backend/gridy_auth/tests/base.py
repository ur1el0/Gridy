from django.core.cache import cache
from rest_framework.test import APITestCase

from gridy_auth.models import APIRateLimitWindow


class IsolatedAuthAPITestCase(APITestCase):
    """Keep auth throttle counters isolated between API test cases."""

    def _pre_setup(self):
        cache.clear()
        super()._pre_setup()
        APIRateLimitWindow.objects.all().delete()

    def _post_teardown(self):
        try:
            super()._post_teardown()
        finally:
            cache.clear()
