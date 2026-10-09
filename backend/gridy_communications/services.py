import logging
from firebase_admin import messaging

logger = logging.getLogger(__name__)


def send_fcm_notification(token, title, body, data=None):
    """
    Sends a push notification to a specific device registration token.
    """
    
    if not token:
        logger.warning("FCM token is empty, skipping notification.")
        return None
        
    formatted_data = None
    
    if data and isinstance(data, dict):
        formatted_data = {str(k): str(v) for k, v in data.items()}
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data=formatted_data,
        token=token
    )
    try:
        response = messaging.send(message)
        logger.info(f"Successfully sent FCM notification: {response}")
        return response
    except Exception as exc:
        logger.error("FCM device notification delivery failed (%s).", type(exc).__name__)
        return None

def send_fcm_topic_notification(topic, title, body, data=None):
    """
    Broadcasts a push notification to a specific topic (e.g., 'announcements').
    """

    # 1. Constrcuts the messaging.Messaging object targeting a 'topic'
    # 2. Send the message using messaging.send()
    # 3. Handle exceptions defensively and return the response or None

    if not topic:
        logger.warning("Topic is empty, skipping notification.")
        return None

    formatted_data = None

    if data and isinstance(data, dict):
        formatted_data = {str(k): str(v) for k, v in data.items()}
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,    
            body=body
            ),
            data=formatted_data,
            topic=topic
        )
    try:
        response = messaging.send(message)
        logger.info(f"Successfully sent to topic {topic}: {response}")
        return response
    except Exception as exc:
        logger.error("FCM topic notification delivery failed (%s).", type(exc).__name__)
        return None


def send_notification_to_user(user, title, body, data=None):
    """
    Sends a push notification to all active devices registered to a specific user
    """

    devices = user.fcm_devices.all()
    if not devices.exists():
        logger.info("No registered devices for push notification recipient.")
        return []

    responses = []
    for device in devices:
        response = send_fcm_notification(device.token, title, body, data)
        if response:
            responses.append(response)
    return responses
