from django.apps import AppConfig

class GridyReportsConfig(AppConfig):
    name = 'gridy_reports'

    def ready(self):
        # Import the signals so Django registers the event listeners
        import gridy_reports.signals