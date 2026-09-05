from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from gridy_auth.models import User, Resident, Barangay
from datetime import date

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True)
    birth_date = serializers.DateField(write_only=True)
    voter_status = serializers.BooleanField(write_only=True, default=False)
    contact_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    guardian_id = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'full_name', 'birth_date', 'voter_status', 'contact_number', 'guardian_id']

    # 1. This validates JUST the password
    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    # 2. This validates the ENTIRE payload (attrs)
    def validate(self, attrs):
        birth_date = attrs.get('birth_date')
        guardian_id = attrs.get('guardian_id')

        # Calculate precise age server-side
        age = None
        if birth_date:
            today = date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

        # Enforce minor constraint barrier
        if age is not None and age < 18 and not guardian_id:
            raise serializers.ValidationError({"guardian_id": "Residents under 18 must provide a guardian's Registered ID."})
        
        # Validate Guardian ID mapping
        if guardian_id:
            try:
                # The mobile app uses 'username' as the Barangay ID/Registered ID
                guardian_user = User.objects.get(username=guardian_id, role=User.Role.RESIDENT)
                # Stash the actual Resident object in attrs for the create() method
                attrs['guardian_resident'] = guardian_user.profile
            except (User.DoesNotExist, Resident.DoesNotExist):
                raise serializers.ValidationError({"guardian_id": "No resident found with this Registered ID."})
            
        return attrs

    def create(self, validated_data):
        profile_data = {
            'full_name': validated_data.pop('full_name'),
            'birth_date': validated_data.pop('birth_date'),
            'voter_status': validated_data.pop('voter_status', False),
            'contact_number': validated_data.pop('contact_number', ''),
        }

        # Extract the resolved guardian Resident objects
        guardian_resident = validated_data.pop('guardian_resident', None)
        validated_data.pop('guardian_id', None)

        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                password=validated_data['password'],
                role=User.Role.RESIDENT
            )
            Resident.objects.create(user=user, guardian=guardian_resident, **profile_data)

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
                is_staff=True,
                is_active=False
            )

        return user

