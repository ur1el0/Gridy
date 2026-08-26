from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, Resident, Barangay, RefreshSession


class BarangaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Barangay
        fields = ['id', 'name', 'logo', 'city_seal', 'captain_name', 'office_contact']

class ResidentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, default='')
    email = serializers.CharField(source='user.email', read_only=True, default='')
    class Meta:
        model = Resident
        fields = ['id', 'username', 'email', 'full_name', 'birth_date', 'voter_status', 'contact_number', 'purok', 'is_verified', 'guardian']


class UserSerializer(serializers.ModelSerializer):
    profile = ResidentSerializer(read_only=True)
    barangay = BarangaySerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'barangay','profile', 'email_alerts', 'push_alerts']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['full_name'] = getattr(user.profile, 'full_name', user.username) if hasattr(user, 'profile') else user.username
        token['role'] = user.role
        token['barangay_id'] = user.barangay.id if user.barangay else None
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'barangay_id': self.user.barangay.id if self.user.barangay else None,
            'full_name': getattr(self.user.profile, 'full_name', self.user.username) if hasattr(self.user, 'profile') else self.user.username,
        }
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True)
    birth_date = serializers.DateField(write_only=True)
    voter_status = serializers.BooleanField(write_only=True, default=False)
    contact_number = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'full_name', 'birth_date', 'voter_status', 'contact_number']

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value


    def create(self, validated_data):
        profile_data = {
            'full_name': validated_data.pop('full_name'),
            'birth_date': validated_data.pop('birth_date'),
            'voter_status': validated_data.pop('voter_status', False),
            'contact_number': validated_data.pop('contact_number', ''),
        }

        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                password=validated_data['password'],
                role=User.Role.RESIDENT
            )
            Resident.objects.create(user=user, **profile_data)

        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value


class RefreshSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RefreshSession
        fields = ['id', 'ip_address', 'user_agent', 'created_at', 'expires_at', 'is_revoked']
        read_only_fields = ['id', 'ip_address', 'user_agent', 'created_at', 'expires_at', 'is_revoked']