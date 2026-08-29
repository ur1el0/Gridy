from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from drf_spectacular.utils import extend_schema, OpenApiTypes
from django.utils import timezone
from datetime import datetime
from django.db import transaction

from gridy_auth.models import User, RefreshSession
from gridy_auth.serializers import (
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from gridy_audit.services import get_client_ip

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            refresh_token_str = response.data.get('refresh')

            # Extract UUID JTI identifier and expiration date from refresh token payload
            try:
                refresh_token = RefreshToken(refresh_token_str)
                jti = refresh_token['jti']
                exp_timestamp = refresh_token['exp']
                expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.UTC)
            except Exception:
                return Response({"detail": "Token structure invalid."}, status=status.HTTP_400_BAD_REQUEST)
        
            # Get user agent and client connection IP
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            ip_address = get_client_ip(request)

            # Fetch the user instance based on token claim
            user_id = refresh_token['user_id']
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            if user.role == User.Role.RESIDENT:
                if hasattr(user, 'profile') and not user.profile.is_verified:
                    return Response(
                        {"detail": "Your resident account is pending verification by the admin. Please try again later."},
                        status=status.HTTP_403_FORBIDDEN
                    )

            # Create session in the database
            RefreshSession.objects.create(
                user=user,
                refresh_token_jti=jti,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=expires_at
            )

            # Set refresh token in HttpOnly SameSite secure cookie
            secure_cookie = not settings.DEBUG
            response.set_cookie(
                key='refresh_token',
                value=refresh_token_str,
                httponly=True,
                secure=secure_cookie,
                samesite='Strict',
                expires=expires_at
            )

            # Delete the raw refresh token string from the JSON payload
            del response.data['refresh']
        
        return response


class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Retrieve refresh token from browser cookies
        refresh_token_str = request.COOKIES.get('refresh_token')
        if not refresh_token_str:
            return Response({"detail": "Session cookie missing."}, status=status.HTTP_401_UNAUTHORIZED)

        # Inject it into serializer data so SimpleJWT can validate it
        serializer = self.get_serializer(data={'refresh': refresh_token_str})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken):
            return Response({"detail": "Session token invalid or expired."}, status=status.HTTP_401_UNAUTHORIZED)

        access_token_str = serializer.validated_data.get('access')
        new_refresh_token_str = serializer.validated_data.get('refresh')

        # Check session mapping status in the database
        try:
            old_token = RefreshToken(refresh_token_str, verify=False)
            old_jti = old_token['jti']
            session = RefreshSession.objects.filter(refresh_token_jti=old_jti, is_revoked=False).first()
            if not session:
                return Response({"detail": "Session is revoked or invalid."}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception:
            return Response({"detail": "Invalid token details."}, status=status.HTTP_401_UNAUTHORIZED)

        # Handle token rotation boundary checks
        if new_refresh_token_str:
            try:
                new_token = RefreshToken(new_refresh_token_str)
                new_jti = new_token['jti']
                new_exp = new_token['exp']
                new_expires_at = datetime.fromtimestamp(new_exp, tz=timezone.UTC)

                with transaction.atomic():
                    # Revoke the old session mapping and save the new active rotated JTI session
                    session.is_revoked = True
                    session.save()

                    RefreshSession.objects.create(
                        user=session.user,
                        refresh_token_jti=new_jti,
                        ip_address=session.ip_address,
                        user_agent=session.user_agent,
                        expires_at=new_expires_at
                    )
            except Exception:
                return Response({"detail": "Rotation credentials failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response_data = {"access": access_token_str}
        response = Response(response_data, status=status.HTTP_200_OK)

        # Update cookie with the rotated refresh token
        if new_refresh_token_str:
            secure_cookie = not settings.DEBUG
            response.set_cookie(
                key='refresh_token',
                value=new_refresh_token_str,
                httponly=True,
                secure=secure_cookie,
                samesite='Strict',
                expires=new_expires_at
            )
            
        return response


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=None, responses={204: None})
    def post(self, request, *args, **kwargs):
        refresh_token_str = request.COOKIES.get('refresh_token')
        if not refresh_token_str:
            return Response({"detail": "No active session cookie found."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token_str)
            jti = token['jti']

            # Revoke the session in database
            session = RefreshSession.objects.filter(refresh_token_jti=jti, is_revoked=False).first()

            if session:
                session.is_revoked = True
                session.save()

            # Blacklist token in outstanding database
            token.blacklist()
        except Exception:
            pass

        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token')
        return response
    
    
class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Request Password Reset Email",
        request=PasswordResetRequestSerializer, 
        responses={200: OpenApiTypes.OBJECT}
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            if user:
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                reset_link = f"http://localhost:5173/reset-password?uidb64={uid}&token={token}"
                
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
from rest_framework import viewsets, permissions
from gridy_auth.serializers import RefreshSessionSerializer

class SessionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Exposes the user's active and revoked sessions for security management.
    """
    serializer_class = RefreshSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RefreshSession.objects.filter(user=self.request.user).order_by('-created_at')

