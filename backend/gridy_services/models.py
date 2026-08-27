from gridy_auth.models import Barangay
from http.client import PROCESSING
from django.db import models
from django.conf import settings

# Create your models here.


class DocumentRequest(models.Model):
    class DocumentType(models.TextChoices):
        BARANGAY_CLEARANCE = 'Barangay Clearance', 'Barangay Clearance'
        INDIGENCY = 'Certificate of Indigency' 'Certificate of Indigency'
        BUSINESS_PERMIT = 'Business Permit' 'Business Permit'
        PROOF_OF_RESIDENCY = 'Proof of Residency', 'Proof of Residency'
        BARANGAY_ID = 'Barangay ID', 'Barangay ID'
        GOOD_MORAL = 'Certificate of Good Moral Character','Certificate of Good Moral Character'
        LATE_REGISTRATION = 'Certificate of Late Registration', 'Certificate of Late Registration'
        SOLO_PARENT = 'Certificate of Solo Parent', 'Certificate of Solo Parent'
        COHABITATION = 'Certificate of Cohabitation', 'Certificate of Cohabitation'
        FIRST_TIME_JOB_SEEKER = 'First Time Job Seeker Certificate', 'First Time Job Seeker Certificate'
        NO_PROPERTY = 'Certificate of No Property', 'Certificate of No Property'
        BPO = 'Barangay Protection Order', 'Barangay Protection Order'


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
        related_name='document_requests'
    )
    document_type = models.CharField(
    max_length=100,
    choices=DocumentType.choices,
    )
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.document_type} - {self.user.username} ({self.status})"

    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
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
        if not self.ticket_number:
            # Sequence ticket numbers liek T001, T002, etc.
            last_ticket = QueueTicket.objects.all().order_by('id').last()
            if last_ticket:
                try:
                    last_num = int(last_ticket.ticket_number[1:])
                    new_num = last_num + 1
                except ValueError:
                    new_num = 1
            else:
                new_num = 1
            self.ticket_number = f"T{new_num:03d}"
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['created_at']),
        ]
            
