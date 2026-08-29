from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from gridy_auth.models import User, RefreshSession

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


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=8)
    uidb64 = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            uid = force_str(urlsafe_base64_decode(data['uidb64']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"uidb64": "Invalid user ID"})
        
        if not default_token_generator.check_token(user, data['token']):
            raise serializers.ValidationError({"token": "Invalid or expired token"})
        
        self.context['user'] = user
        return data
    
    def save(self):
        user = self.context['user']
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class RefreshSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RefreshSession
        fields = ['id', 'ip_address', 'user_agent', 'created_at', 'expires_at', 'is_revoked']
        read_only_fields = fields
