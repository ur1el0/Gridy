from random import choices
from django.db import models
from django.conf import settings

class IssueReport(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'

    class Urgency(models.TextChoices):
        MINOR = 'MINOR', 'Minor'
        MODERATE = 'MODERATE', 'Moderate'
        HAZARD = 'HAZARD', 'Hazard'
        EMERGENCY = 'EMERGENCY', 'Emergency'
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='issue_reports'
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255, help_text="A brief description of where the issue is located.")
    
    # Image uploads will be handled by Cloudinary because of DEFAULT_FILE_STORAGE
    image = models.ImageField(upload_to='issue_reports/', blank=True, null=True)
    
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.PENDING
    )

    urgency = models.CharField(
        max_length = 20,
        choices=Urgency.choices,
        default=Urgency.MINOR
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"


