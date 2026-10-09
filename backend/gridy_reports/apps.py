from django.apps import AppConfig


class KapitBayanReportsConfig(AppConfig):
    name = 'gridy_reports'

    def ready(self):
        # Import the signals so Django registers the event listeners
        import gridy_reports.signals
