import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from .services import send_notification_to_user, send_fcm_topic_notification

logger = logging.getLogger(__name__)


@shared_task
def send_notification_to_user_task(topic, title, body, data=None):
    """
    Background task to broadcast a push notification to a specific topic.
    """
    try:
        response = send_fcm_topic_notification(topic, title, body, data)
        return {"status": "success", "response": str(response)}
    except Exception as e:
        logger.error(f"Celery Task Failed (FCM Topic): {e}")
        return {"status": "error", "error": str(e)}

@shared_task
def async_send_fcm_topic_notification(user_id, title, body, data=None):
    """
    Background task to send a push notification to a specific user.
    """
    from gridy_auth.models import User
    try:
        user = User.objects.get(id=user_id)
        responses = send_notification_to_user(user, title, body, data)
        return {"status": "success", "responses": [str(r) for r in responses]}
    except User.DoesNotExist:
        logger.error(f"Celery Task Failed; User {user_id} not found.")
        return {"status": "error", "error": "User not found"}
    except Exception as e:
        logger.error(f"Celery Task Failed (FCM User): {e}")
        return {"status": "error", "error": str(e)}