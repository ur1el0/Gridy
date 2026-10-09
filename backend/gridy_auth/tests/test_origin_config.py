import os
from unittest.mock import patch

from django.conf import settings
from django.test import TestCase, override_settings


class ProductionOriginConfigurationTests(TestCase):
    def test_production_allowed_hosts_includes_backend_host_and_rejects_wildcards(self):
        from django.core.exceptions import DisallowedHost
        from django.test import RequestFactory
        from django.http.request import validate_host
        from config.settings import get_allowed_hosts

        # Exercise settings derivation without development environment overrides
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('ALLOWED_HOSTS', None)
            prod_allowed_hosts = get_allowed_hosts(debug=False)
            dev_allowed_hosts = get_allowed_hosts(debug=True)

        # Verify derived production hosts do not contain wildcards or development origins
        self.assertIn('gridy-backend.onrender.com', prod_allowed_hosts)
        self.assertNotIn('localhost', prod_allowed_hosts)
        self.assertNotIn('127.0.0.1', prod_allowed_hosts)
        self.assertNotIn('*', prod_allowed_hosts)
        self.assertNotIn('.vercel.app', prod_allowed_hosts)
        self.assertNotIn('.onrender.com', prod_allowed_hosts)

        # Verify development derivation includes localhost
        self.assertIn('localhost', dev_allowed_hosts)
        self.assertIn('127.0.0.1', dev_allowed_hosts)

        factory = RequestFactory()

        # Positive check: canonical host is accepted by validate_host and request.get_host()
        self.assertTrue(validate_host('gridy-backend.onrender.com', prod_allowed_hosts))
        req_good = factory.get('/', HTTP_HOST='gridy-backend.onrender.com')
        with override_settings(ALLOWED_HOSTS=prod_allowed_hosts):
            self.assertEqual(req_good.get_host(), 'gridy-backend.onrender.com')

        # Negative checks: unapproved Vercel, Render, external subdomains, and localhost are rejected in production
        unapproved_hosts = ['malicious.vercel.app', 'attacker.onrender.com', 'evil.example.com', 'localhost']
        for bad_host in unapproved_hosts:
            with self.subTest(host=bad_host):
                self.assertFalse(validate_host(bad_host, prod_allowed_hosts))
                req_bad = factory.get('/', HTTP_HOST=bad_host)
                with override_settings(ALLOWED_HOSTS=prod_allowed_hosts):
                    with self.assertRaises(DisallowedHost):
                        req_bad.get_host()

    def test_production_csrf_origin_validation_rejects_unapproved_origins(self):
        from django.middleware.csrf import CsrfViewMiddleware
        from django.test import RequestFactory
        from config.settings import get_csrf_trusted_origins

        # Exercise settings derivation without development environment overrides
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('CSRF_TRUSTED_ORIGINS', None)
            prod_csrf_origins = get_csrf_trusted_origins(debug=False)
            dev_csrf_origins = get_csrf_trusted_origins(debug=True)

        # Verify derived production CSRF origins do not contain wildcards or development origins
        self.assertIn('https://gridy.vercel.app', prod_csrf_origins)
        self.assertIn('https://gridy-backend.onrender.com', prod_csrf_origins)
        self.assertNotIn('http://localhost:5173', prod_csrf_origins)
        self.assertNotIn('http://localhost:3000', prod_csrf_origins)
        self.assertNotIn('https://*.vercel.app', prod_csrf_origins)
        self.assertNotIn('https://*.onrender.com', prod_csrf_origins)

        # Verify development derivation includes localhost
        self.assertIn('http://localhost:5173', dev_csrf_origins)
        self.assertIn('http://localhost:3000', dev_csrf_origins)

        factory = RequestFactory()
        mw = CsrfViewMiddleware(lambda req: None)

        with override_settings(CSRF_TRUSTED_ORIGINS=prod_csrf_origins):
            # Positive check: approved origins pass verification
            for good_origin in prod_csrf_origins:
                with self.subTest(origin=good_origin):
                    req = factory.post('/', HTTP_ORIGIN=good_origin)
                    self.assertTrue(mw._origin_verified(req))

            # Negative checks: unapproved Vercel, Render, external, and localhost origins fail verification and return 403
            unapproved_origins = [
                'https://malicious.vercel.app',
                'https://attacker.onrender.com',
                'https://evil.example.com',
                'http://localhost:5173',
                'http://localhost:3000',
            ]
            for bad_origin in unapproved_origins:
                with self.subTest(origin=bad_origin):
                    req = factory.post('/', HTTP_ORIGIN=bad_origin)
                    self.assertFalse(mw._origin_verified(req))
                    resp = mw.process_view(req, lambda r: None, (), {})
                    self.assertIsNotNone(resp)
                    self.assertEqual(resp.status_code, 403)

    def test_production_cors_policy_rejects_arbitrary_origins_when_debug_false(self):
        from urllib.parse import urlsplit
        from corsheaders.middleware import CorsMiddleware
        from config.settings import get_cors_allowed_origins, get_cors_allowed_origin_regexes

        # Exercise settings derivation without development environment overrides
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('CORS_ALLOWED_ORIGINS', None)
            prod_cors = get_cors_allowed_origins(debug=False)
            prod_regexes = get_cors_allowed_origin_regexes(debug=False)
            dev_cors = get_cors_allowed_origins(debug=True)
            dev_regexes = get_cors_allowed_origin_regexes(debug=True)

        # Verify derived production CORS settings default to empty
        self.assertEqual(prod_cors, [])
        self.assertEqual(prod_regexes, [])

        # Verify development derivation includes localhost
        self.assertIn('http://localhost:5173', dev_cors)
        self.assertTrue(len(dev_regexes) > 0)

        mw = CorsMiddleware(lambda req: None)
        with override_settings(DEBUG=False, CORS_ALLOWED_ORIGINS=prod_cors, CORS_ALLOWED_ORIGIN_REGEXES=prod_regexes):
            self.assertFalse(
                mw.origin_found_in_white_lists('https://malicious.vercel.app', urlsplit('https://malicious.vercel.app'))
            )
            self.assertFalse(
                mw.origin_found_in_white_lists('https://attacker.onrender.com', urlsplit('https://attacker.onrender.com'))
            )
            self.assertFalse(
                mw.origin_found_in_white_lists('http://localhost:5173', urlsplit('http://localhost:5173'))
            )
            self.assertFalse(
                mw.origin_found_in_white_lists('https://evil.example.com', urlsplit('https://evil.example.com'))
            )

    def test_refresh_cookie_samesite_policy_defaults_to_strict(self):
        self.assertEqual(getattr(settings, 'REFRESH_COOKIE_SAMESITE', 'Strict'), 'Strict')
