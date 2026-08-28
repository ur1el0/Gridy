from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, Resident, Barangay

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
        fields = ['id', 'username', 'email', 'role', 'barangay','profile']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        full_name = getattr(user.profile, 'full_name', None) if hasattr(user, 'profile') else None
        if not full_name:
            full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        token['full_name'] = full_name
        token['role'] = user.role
        token['barangay_id'] = user.barangay.id if user.barangay else None
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        full_name = getattr(self.user.profile, 'full_name', None) if hasattr(self.user, 'profile') else None
        if not full_name:
            full_name = f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'barangay_id': self.user.barangay.id if self.user.barangay else None,
            'full_name': full_name,
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


class AdminRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255, write_only=True)
    barangay_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    affirmation = serializers.BooleanField(write_only=True, default=False)

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        if not attrs.get('affirmation'):
            raise serializers.ValidationError({"affirmation": "You must affirm authorized status to register."})

        email = attrs.get('email')
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "An account with this email already exists."})

        barangay_id = attrs.get('barangay_id')
        if barangay_id:
            if not Barangay.objects.filter(id=barangay_id).exists():
                raise serializers.ValidationError({"barangay_id": f"Barangay with ID {barangay_id} does not exist."})

        return attrs

    def create(self, validated_data):
        full_name = validated_data['full_name'].strip()
        email = validated_data['email'].strip().lower()
        password = validated_data['password']
        barangay_id = validated_data.get('barangay_id')

        # Split full name into first and last name
        name_parts = full_name.split(maxsplit=1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        # Generate unique username derived from email or name
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        barangay = None
        if barangay_id:
            barangay = Barangay.objects.get(id=barangay_id)

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=User.Role.ADMIN,
                barangay=barangay,
                is_staff=True
            )

        return user
