from rest_framework import serializers
from gridy_auth.models import User, Resident, Barangay

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
    class Meta:
        model = Resident
        fields = [
            'id', 'username', 'email', 'full_name', 'birth_date', 'voter_status', 
            'contact_number', 'purok', 'is_verified', 'guardian', 
            'philsys_id_number', 'philsys_id_photo', 'secondary_id_type',
            'secondary_id_photo', 'utility_billing_type', 'utility_billing_photo'
        ]

class UserSerializer(serializers.ModelSerializer):
    profile = ResidentSerializer(required=False)
    barangay = BarangaySerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'barangay','profile']
        read_only_fields = ['role', 'barangay']

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

