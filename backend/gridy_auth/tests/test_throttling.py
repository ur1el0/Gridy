from unittest.mock import patch

from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle

from .base import IsolatedAuthAPITestCase


class AuthScopedThrottleTests(IsolatedAuthAPITestCase):
    def _rates_patch(self, throttle_class, **rates):
        configured_rates = dict(throttle_class.THROTTLE_RATES)
        configured_rates.update(rates)
        return patch.object(throttle_class, 'THROTTLE_RATES', configured_rates)

    def test_default_throttle_rates_are_loaded_by_drf(self):
        self.assertEqual(
            ScopedRateThrottle.THROTTLE_RATES['auth_login'],
            '10/minute',
        )
        self.assertEqual(
            ScopedRateThrottle.THROTTLE_RATES['auth_register'],
            '20/hour',
        )
        self.assertEqual(
            ScopedRateThrottle.THROTTLE_RATES['auth_admin_register'],
            '5/hour',
        )
        self.assertEqual(
            ScopedRateThrottle.THROTTLE_RATES['password_reset_request'],
            '5/hour',
        )
        self.assertEqual(
            ScopedRateThrottle.THROTTLE_RATES['password_reset_confirm'],
            '10/hour',
        )

    def test_authentication_and_recovery_routes_enforce_scoped_limits(self):
        endpoints = [
            (
                'auth_login',
                reverse('auth_login'),
                {'username': 'unknown-user', 'password': 'WrongPassword123!'},
            ),
            ('auth_register', reverse('auth_register'), {}),
            ('auth_admin_register', reverse('auth_register_admin'), {}),
            (
                'password_reset_request',
                reverse('password_reset_request'),
                {'email': 'unregistered@example.com'},
            ),
            ('password_reset_confirm', reverse('password_reset_confirm'), {}),
        ]

        for scope, url, payload in endpoints:
            with self.subTest(scope=scope):
                cache.clear()
                with self._rates_patch(ScopedRateThrottle, **{scope: '1/minute'}):
                    first_response = self.client.post(url, payload, format='json')
                    self.assertNotEqual(
                        first_response.status_code,
                        status.HTTP_429_TOO_MANY_REQUESTS,
                    )

                    second_response = self.client.post(url, payload, format='json')
                    self.assertEqual(
                        second_response.status_code,
                        status.HTTP_429_TOO_MANY_REQUESTS,
                    )

    def test_login_and_password_reset_have_independent_budgets(self):
        cache.clear()
        with self._rates_patch(
            ScopedRateThrottle,
            auth_login='1/minute',
            password_reset_request='1/minute',
        ):
            login_url = reverse('auth_login')
            reset_url = reverse('password_reset_request')

            login_payload = {
                'username': 'unknown-user',
                'password': 'WrongPassword123!',
            }
            reset_payload = {'email': 'unregistered@example.com'}
            login_first = self.client.post(login_url, login_payload, format='json')
            reset_first = self.client.post(reset_url, reset_payload, format='json')
            self.assertNotEqual(
                login_first.status_code,
                status.HTTP_429_TOO_MANY_REQUESTS,
            )
            self.assertNotEqual(
                reset_first.status_code,
                status.HTTP_429_TOO_MANY_REQUESTS,
            )

            login_second = self.client.post(login_url, login_payload, format='json')
            reset_second = self.client.post(reset_url, reset_payload, format='json')
            self.assertEqual(
                login_second.status_code,
                status.HTTP_429_TOO_MANY_REQUESTS,
            )
            self.assertEqual(
                reset_second.status_code,
                status.HTTP_429_TOO_MANY_REQUESTS,
            )
