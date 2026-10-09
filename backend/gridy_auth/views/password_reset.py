from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from gridy_auth.models import User
from gridy_auth.serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'password_reset_request'

    @extend_schema(
        summary="Request Password Reset Email",
        request=PasswordResetRequestSerializer,
        responses={200: OpenApiTypes.OBJECT}
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            matching_users = list(
                User.objects.filter(email__iexact=email)[:2]
            )

            if len(matching_users) == 1:
                user = matching_users[0]
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                token = default_token_generator.make_token(user)
                reset_link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?uidb64={uid}&token={token}"

                send_mail(
                    subject="Gridy: Password Reset Request",
                    message=f"Hello,\n\nYou requested a password reset. Click the link below to set a new password:\n\n{reset_link}\n\nIf you did not request this, please ignore this email.",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
            return Response(
                {"detail": "If your email is registered, a reset link has been sent."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'password_reset_confirm'

    @extend_schema(
        summary="Confirm New Password via Token",
        request=PasswordResetConfirmSerializer,
        responses={200: OpenApiTypes.OBJECT}
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
