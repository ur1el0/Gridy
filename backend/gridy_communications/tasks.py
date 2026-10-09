import logging
from gridy_auth.tasks import async_task
from .services import send_notification_to_user, send_fcm_topic_notification

logger = logging.getLogger(__name__)

@async_task
def async_send_fcm_topic_notification(topic, title, body, data=None):
    """
    Background task to broadcast a push notification to a specific topic without Celery.
    """
    try:
        response = send_fcm_topic_notification(topic, title, body, data)
        return {"status": "success", "response": str(response)}
    except Exception as exc:
        logger.error("Background topic notification failed (%s).", type(exc).__name__)
        return {"status": "error", "error": "Notification delivery failed"}

@async_task
def send_notification_to_user_task(user_id, title, body, data=None):
    """
    Background task to send a push notification to a specific user without Celery.
    """
    from gridy_auth.models import User
    try:
        user = User.objects.get(id=user_id)
        responses = send_notification_to_user(user, title, body, data)
        return {"status": "success", "responses": [str(r) for r in responses]}
    except User.DoesNotExist:
        logger.warning("Push notification recipient no longer exists.")
        return {"status": "error", "error": "User not found"}
    except Exception as exc:
        logger.error("Background user notification failed (%s).", type(exc).__name__)
        return {"status": "error", "error": "Notification delivery failed"}
