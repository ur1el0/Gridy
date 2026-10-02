from gridy_auth.models import Barangay
from django.conf import settings
from django.utils import timezone

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.core.exceptions import ValidationError
from django.db import models, transaction

MANILA_TIME_ZONE = ZoneInfo("Asia/Manila")

# Create your models here.

class DocumentRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSING = 'PROCESSING', 'Processing'
        READY_FOR_PICKUP = 'READY_FOR_PICKUP', 'Ready for Pickup'
        REJECTED = 'REJECTED', 'Rejected'
        RELEASED = 'RELEASED', 'Released'

    class UrgencyTag(models.TextChoices):
        REGULAR = 'REGULAR', 'Regular'
        URGENT = 'URGENT', 'Urgent'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='document_requests'
    )
    barangay = models.ForeignKey(
        Barangay,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='document_requests'
    )
    # Walk-in & Legacy Support
    is_walkin = models.BooleanField(default=False, db_index=True)
    walkin_name = models.CharField(max_length=255, blank=True, null=True)
    walkin_purok = models.CharField(max_length=100, blank=True, null=True)

    document_type = models.CharField(max_length=100)
    purpose = models.TextField(blank=True, null=True)
    urgency_tag = models.CharField(
        max_length=20,
        choices=UrgencyTag.choices,
        default=UrgencyTag.REGULAR,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    admin_notes = models.TextField(blank=True, null=True)

    # Official Receipt (OR) & Fee Auditing
    or_number = models.CharField(max_length=50, blank=True, null=True, help_text="Official Receipt Number issued by Barangay Treasurer")
    fee_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="Clearance issuance fee in PHP")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        applicant = self.user.username if self.user else f"Walk-in: {self.walkin_name}"
        return f"{self.document_type} - {applicant} ({self.status})"

    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['barangay', 'status']),
            models.Index(fields=['status']),
        ]

class QueueTicket(models.Model):
    class Status(models.TextChoices):
        WAITING = 'WAITING', 'Waiting'
        SERVING = 'SERVING', 'Serving'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class Priority(models.TextChoices):
        REGULAR = 'regular', 'Regular'
        PRIORITY = 'priority', 'Priority/Senior/PWD/Pregnant'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='queue_tickets'
    )

    barangay = models.ForeignKey(
        Barangay,
        on_delete=models.CASCADE,
        null=True,
        related_name='queue_tickets'
    )
    ticket_number = models.CharField(max_length=20)
    service_type = models.CharField(max_length=100)
    # New Fields for Manual Entry
    walkin_name = models.CharField(max_length=255, blank=True, null=True)
    priority_status = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.REGULAR,
    )
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.WAITING,
    )
    is_priority = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Ticket {self.ticket_number} ({self.status})"


    def save(self, *args, **kwargs):
        if self.ticket_number:
            return super().save(*args, **kwargs)

        if self.barangay_id is None:
            raise ValidationError(
                "A barangay is required to assign a queue ticket number."
            )

        with transaction.atomic():
            Barangay.objects.select_for_update().get(pk=self.barangay_id)

            manila_now = timezone.localtime(
                timezone.now(),
                MANILA_TIME_ZONE,
            )
            manila_day_start = datetime.combine(
                manila_now.date(),
                time.min,
                tzinfo=MANILA_TIME_ZONE,
            )
            next_manila_day_start = manila_day_start + timedelta(days=1)

            existing_numbers = QueueTicket.objects.filter(
                barangay_id=self.barangay_id,
                created_at__gte=manila_day_start,
                created_at__lt=next_manila_day_start,
            ).values_list("ticket_number", flat=True)

            highest_number = max(
                (
                    int(number[1:])
                    for number in existing_numbers
                    if number.startswith("T") and number[1:].isdigit()
                ),
                default=0,
            )

            self.ticket_number = f"T{highest_number + 1:03d}"
            super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['created_at']),
        ]
            
