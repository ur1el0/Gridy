from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def send_welcome_email(user_email, full_name):
    subject = "Welcome to Gridy!"
    message = f"Hello {full_name},\n\nWelcome to Gridy. We are excited to have you on board!"
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user_email],
        fail_silently=False,
    )
    return f"Sent welcome email to {user_email}"
