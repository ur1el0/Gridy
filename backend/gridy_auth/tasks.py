import threading
import functools
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

def async_task(func):
    """
    Decorator that executes a function in a background daemon thread,
    providing .delay() compatibility so call sites work seamlessly without Celery or Redis.
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        thread = threading.Thread(target=func, args=args, kwargs=kwargs, daemon=True)
        try:
            thread.start()
        except Exception as exc:
            logger.error(
                "Could not start background task %s (%s).",
                func.__name__,
                type(exc).__name__,
            )
            return None
        return thread
    
    wrapper.delay = wrapper
    return wrapper

@async_task
def send_welcome_email(user_email, full_name):
    """
    Sends a welcome email to newly registered users in a non-blocking background thread.
    """
    try:
        subject = "Welcome to Gridy!"
        message = f"Hello {full_name}, \n\nWelcome to Gridy. We are excited to have you on board!"
        sent_count = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            fail_silently=False,
        )
        if sent_count != 1:
            logger.error("Email backend did not accept the welcome message.")
        return sent_count
    except Exception as exc:
        logger.error("Welcome email delivery failed (%s).", type(exc).__name__)

@async_task
def send_barangay_approval_email(user_email, applicant_name, barangay_name):
    """Tell the verified first official how to establish their login password."""
    try:
        reset_page = f"{settings.FRONTEND_URL.rstrip('/')}/forgot-password"
        subject = "Gridy barangay account approved"
        message = (
            f"Hello {applicant_name},\n\n"
            f"The application for {barangay_name} was approved and your official "
            "account is ready. No password was created for you. Visit the Gridy "
            f"password recovery page ({reset_page}) and request a private reset "
            "link using this email address to set your password.\n\n"
            "Gridy staff will never ask you to send your password or payment-account credentials."
        )
        sent_count = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.error("Barangay approval email delivery failed (%s).", type(exc).__name__)
        return

    if sent_count != 1:
        logger.error("Email backend did not accept the barangay approval message.")
    return sent_count
