from celery import shared_task
from django.contrib.auth import get_user_model
from .services import send_notification_to_user

User = get_user_model()

@shared_task
def send_notification_to_user_task(user_id, title, body, data=None):
    """
    Asynchronous Celery task that retrieves the user record and 
    dispatches push notifications in the background worker thread.
    """

    try:
        user = User.objects.get(id=user_id)
        return send_notification_to_user(user, title, body, data)
    except User.DoesNotExist:
        return None