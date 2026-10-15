import re
from collections.abc import Mapping
from rest_framework import serializers
from gridy_auth.models import User


class StaffUserListSerializer(serializers.ModelSerializer):
    """
    Represents an authorized Field Official belonging to the administrator's Barangay.
    """
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_active",
            "date_joined",
            "last_login",
        ]
        read_only_fields = fields

    def get_full_name(self, obj) -> str:
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.username


class StaffUserCreateSerializer(serializers.Serializer):
    """
    Validates payload for onboarding a new Field Official.
    Enforces strict field boundaries and case-insensitive uniqueness. New
    field officials set their own password through the private setup flow.
    """
    username = serializers.CharField(
        min_length=3,
        max_length=150,
        trim_whitespace=True,
    )
    email = serializers.EmailField(
        max_length=254,
    )
    first_name = serializers.CharField(
        min_length=1,
        max_length=150,
        trim_whitespace=True,
    )
    last_name = serializers.CharField(
        min_length=1,
        max_length=150,
        trim_whitespace=True,
    )

    def validate(self, attrs):
        # Strict rejection of disallowed extra fields (e.g. role, barangay, is_staff, is_superuser)
        if isinstance(self.initial_data, Mapping):
            allowed_fields = {"username", "email", "first_name", "last_name"}
            disallowed = set(self.initial_data.keys()) - allowed_fields
            if disallowed:
                raise serializers.ValidationError(
                    f"Disallowed fields in request payload: {', '.join(sorted(disallowed))}."
                )

        username = attrs.get("username", "").strip()
        if not re.match(r"^[\w.@+-]+$", username):
            raise serializers.ValidationError(
                {"username": "Enter a valid username containing letters, numbers, and @/./+/-/_ characters."}
            )

        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError(
                {"username": "A user with that username already exists."}
            )

        email = attrs.get("email", "").strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                {"email": "A user with that email address already exists."}
            )

        return attrs
