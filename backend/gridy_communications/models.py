from django.db import models
from django.conf import settings


# Create your models here.

class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='announcements')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        indexes = [
            models.Index(fields=['is_pinned', 'created_at']),
        ]


class ActivitySchedule(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    event_datetime = models.DateTimeField()
    location = models.CharField(max_length=255)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class FCMDevice(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name="fcm_devices"
    )

    # FCM reg tokens are typically long strs (up to 255+ chars)
    token = models.TextField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s Device ({self.token[:20]}...)"

class EmergencyHotline(models.Model):
    class Category(models.TextChoices):
        POLICE = 'POLICE', 'Police'
        FIRE = 'FIRE', 'Fire Department'
        MEDICAL = 'MEDICAL', 'Medical / Hospital'
        BARANGAY = 'BARANGAY', 'Barangay Desk'
        OTHER = 'OTHER', 'Other'

    name = models.CharField(max_length=255)
    number = models.CharField(max_length=50)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER
    )
    # Security: Track which barangay admin created this hotline
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='hotlines'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.number}"
    
    class Meta:
        ordering = ['category', 'name']