from django.db.models import OneToOneField
from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        RESIDENT = 'RESIDENT', 'Resident'

    role = models.CharField(
        max_length=50,
        choices=Role.choices,
        default=Role.RESIDENT,
    )
        
class Resident(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255)
    birth_date = models.DateField()
    voter_status = models.BooleanField(default=False)
    contact_number = models.CharField(max_length=20, null=True, blank=True)
    purok = models.PositiveIntegerField(null=True, blank=True)
<<<<<<< Updated upstream
=======
    is_verified = models.BooleanField(default=False)
    guardian = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='dependents')
>>>>>>> Stashed changes
    

    def __str__(self):
        return f'{self.full_name}'


class RefreshSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    refresh_token_jti = models.CharField(max_length=255, unique=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)

    def __str__(self):
        return f"Session for {self.user.username} (JTI: {self.refresh_token_jti[:8]})"