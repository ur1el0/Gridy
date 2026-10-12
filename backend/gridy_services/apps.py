from django.apps import AppConfig


class KapitBayanServicesConfig(AppConfig):
    name = 'gridy_services'

    def ready(self):
        import gridy_services.signals  # noqa: F401
