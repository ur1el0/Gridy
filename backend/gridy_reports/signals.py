import firebase_admin
from firebase_admin import messaging
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import IssueReport
from gridy_communications.models import FCMDevice

@receiver(pre_save, sender=IssueReport)
def capture_old_status(sender, instance, **kwargs):
    """
    Captures the previous status before the save happends to detect changes.
    """
    if instance.pk:
        try:
            instance._old_status = IssueReport.objects.get(pk=instance.pk).status
        except IssueReport.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=IssueReport)
def notify_issue_update(sender, instance, created, **kwargs):
    """
    Fires a Push Notification if the status was changed by an admin.
    """
    old_status = getattr(instance, '_old_status', None)

    if old_status != instance.status and  not created:

        # 1. Format the visual notification text
        status_text = instance.get_status_display()
        title = "Gridy Issue Update"
        body = f"Your report '{instance.title}' is now marked as: {status_text}."

        # 2. Get all logged-in devices for the resident who reported the issue
        devices = FCMDevice.objects.filter(user=instance.reporter)
        tokens = [device.token for device in devices]

        # 3. Fire the payload to Google's FCM servers
        if tokens and firebase_admin._apps:
            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                tokens=tokens,
            )

            try:
                response = messaging.send_each_for_multicast(message)
                print(f"Successfully send push notifications to {response.success_count} devices.")
            except Exception as e:
                print(f"Failed to send push notifications: {e}")