import logging
from django.db import transaction
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import DocumentRequest

logger = logging.getLogger(__name__)


def safe_delete_storage_file(storage, file_name):
    """
    Safely delete a storage file without raising unhandled exceptions
    if the file was already deleted or storage is unreachable.
    """
    if not file_name or not storage:
        return
    try:
        if storage.exists(file_name):
            storage.delete(file_name)
    except Exception as exc:
        logger.warning("Failed to delete private storage file %s: %s", file_name, exc)


@receiver(post_delete, sender=DocumentRequest)
def delete_document_payment_proof_on_delete(sender, instance, **kwargs):
    """
    Ensure the private payment proof image is purged from storage
    only after the DocumentRequest row deletion commits to the database.
    """
    if instance.payment_proof_image and instance.payment_proof_image.name:
        storage = instance.payment_proof_image.storage
        file_name = instance.payment_proof_image.name
        transaction.on_commit(lambda: safe_delete_storage_file(storage, file_name))

