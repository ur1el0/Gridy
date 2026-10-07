from rest_framework import serializers
from django.urls import reverse
from gridy_auth.models import User, Resident, Barangay


class ResidentPrivateImageField(serializers.ImageField):
    def to_representation(self, value):
        if not value:
            return None

        resident = getattr(value, 'instance', None)
        if resident is None or resident.pk is None:
            return None

        url = reverse(
            'resident_private_media',
            kwargs={
                'resident_id': resident.pk,
                'field_name': self.field_name,
            },
        )
        return url.removeprefix('/api/v1/')


class BarangaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Barangay
        fields = [
            'id', 
            'name', 
            'logo', 
            'city_seal', 
            'captain_name', 
            'office_contact',
            'primary_color',
        ]

class ResidentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, default='')
    email = serializers.CharField(source='user.email', read_only=True, default='')
    philsys_id_photo = ResidentPrivateImageField(required=False, allow_null=True)
    secondary_id_photo = ResidentPrivateImageField(required=False, allow_null=True)
    utility_billing_photo = ResidentPrivateImageField(required=False, allow_null=True)
    class Meta:
        model = Resident
        fields = [
            'id', 'username', 'email', 'full_name', 'birth_date', 'voter_status', 
            'contact_number', 'purok', 'is_verified', 'guardian', 
            'philsys_id_number', 'philsys_id_photo', 'secondary_id_type',
            'secondary_id_photo', 'utility_billing_type', 'utility_billing_photo'
        ]
        read_only_fields = ['is_verified']

class ResidentAdminUpdateSerializer(ResidentSerializer):
    email = serializers.EmailField(
        source='user.email',
        required=False,
        allow_blank=False,
    )

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        existing_users = User.objects.filter(email__iexact=normalized_email)

        if self.instance is not None:
            existing_users = existing_users.exclude(
                pk=self.instance.user_id,
            )

        if existing_users.exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return normalized_email

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        email = user_data.get('email')

        if email is not None:
            instance.user.email = email
            instance.user.save(update_fields=['email'])

        return super().update(instance, validated_data)

class UserSerializer(serializers.ModelSerializer):
    profile = ResidentSerializer(required=False)
    barangay = BarangaySerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'barangay', 'profile', 'full_name']
        read_only_fields = ['role', 'barangay', 'full_name']
        
    def get_full_name(self, obj):
        full_name = getattr(obj.profile, 'full_name', None) if hasattr(obj, 'profile') else None
        if not full_name:
            full_name = f"{obj.first_name} {obj.last_name}".strip() or obj.username
        return full_name

    def update(self, instance, validated_data):
        # Extract the profile dictionary from the request
        profile_data = validated_data.pop('profile', None)

        # Update standard User fields (username, email)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update nested Resident profile fields (contact_number)
        if profile_data and hasattr(instance, 'profile'):
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance
