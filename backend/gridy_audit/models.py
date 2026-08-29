from django.db import models
from django.conf import settings

# Create your models here.

class AuditLog(models.Model):
    class ActionType(models.TextChoices):
        DOCUMENT_ACTION = 'DOCUMENT_ACTION', 'Document Request Action'
        QUEUE_ACTION = 'QUEUE_ACTION', 'Queue Ticket Action'
        REPORT_ACTION = 'REPORT_ACTION', 'Incident Report Action'
        USER_ACTION = 'USER_ACTION', 'User Verification Action'

    action_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action_type = models.CharField(
        max_length=20,
        choices=ActionType.choices
    )
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.action_by.username} - {self.action_type} at {self.timestamp}"