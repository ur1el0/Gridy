import os
import firebase_admin
from firebase_admin import credentials
from django.apps import AppConfig
from django.conf import settings

class GridyCommunicationsConfig(AppConfig):
    name = 'gridy_communications'

    def ready(self):
        # Initialize Firebase Admin securely when the Django server boots
        if not firebase_admin._apps:
            key_path = os.path.join(settings.BASE_DIR, 'firebase-admin-key.json')
            
            # Check if the file actually exists to prevent server crashes in environments
            # where push notifications might be disabled or keys are missing.
            if os.path.exists(key_path):
                cred = credentials.Certificate(key_path)
                firebase_admin.initialize_app(cred)
            else:
                print(f"WARNING: Firebase Admin Key not found at {key_path}. Push notifications will fail.")
    