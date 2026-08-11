from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def send_welcome_email(user_email, full_name):
    """
    Sends an asynchronous welcome email to newly registered users.
    """

    subject = 'Welcome to Gridy!'
    message = f'''
    Hi {full_name},

    Welcome to Gridy! Your account has been successfully created.
    You can now use our platform to request documents, report issues, and queue for services.

    Regards,
    The Gridy Team
    '''


    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user_email],
        fail_silently=False,
    )