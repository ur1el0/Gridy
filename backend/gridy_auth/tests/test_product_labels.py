import os
from unittest.mock import patch

from django.apps import apps
from django.test import SimpleTestCase

from config.settings import get_test_use_sqlite


class ProductLabelTests(SimpleTestCase):
    def test_app_config_classes_are_branded_without_changing_app_labels(self):
        expected = {
            "gridy_auth": "KapitBayanAuthConfig",
            "gridy_services": "KapitBayanServicesConfig",
            "gridy_reports": "KapitBayanReportsConfig",
            "gridy_communications": "KapitBayanCommunicationsConfig",
            "gridy_audit": "KapitBayanAuditConfig",
        }

        for app_label, class_name in expected.items():
            with self.subTest(app_label=app_label):
                app_config = apps.get_app_config(app_label)
                self.assertEqual(type(app_config).__name__, class_name)
                self.assertEqual(app_config.label, app_label)

    def test_preferred_sqlite_setting_overrides_legacy_setting(self):
        with patch.dict(os.environ):
            os.environ["KAPITBAYAN_TEST_USE_SQLITE"] = "False"
            os.environ["GRIDY_TEST_USE_SQLITE"] = "True"
            self.assertFalse(get_test_use_sqlite())

            os.environ["KAPITBAYAN_TEST_USE_SQLITE"] = "True"
            os.environ["GRIDY_TEST_USE_SQLITE"] = "False"
            self.assertTrue(get_test_use_sqlite())

    def test_legacy_sqlite_setting_is_used_when_preferred_setting_is_unset(self):
        with patch.dict(os.environ):
            os.environ.pop("KAPITBAYAN_TEST_USE_SQLITE", None)
            os.environ["GRIDY_TEST_USE_SQLITE"] = "False"
            self.assertFalse(get_test_use_sqlite())

    def test_sqlite_setting_defaults_to_true(self):
        with patch.dict(os.environ):
            os.environ.pop("KAPITBAYAN_TEST_USE_SQLITE", None)
            os.environ.pop("GRIDY_TEST_USE_SQLITE", None)
            self.assertTrue(get_test_use_sqlite())
