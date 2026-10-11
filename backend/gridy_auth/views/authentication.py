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
from http.cookies import SimpleCookie, Morsel, _unquote
from collections.abc import Mapping
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
    throttle_scope = 'auth_login'

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

            # 1. Enforce Resident Verification Status
            if user.role == User.Role.RESIDENT:
                if hasattr(user, 'profile') and not user.profile.is_verified:
                    return Response(
                        {"detail": "Your resident account is pending verification by the admin. Please try again later."},
                        status=status.HTTP_403_FORBIDDEN
                    )

            # 2. SECURITY: Enforce Active Status for Barangay Admins & Field Officials
            if user.role in [User.Role.ADMIN, User.Role.DILG_ADMIN, User.Role.FIELD_OFFICIAL]:
                if not user.is_active:
                    return Response(
                        {"detail": "Your official account is pending verification. Only active, verified barangay personnel can log in."},
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
            samesite_policy = getattr(settings, 'REFRESH_COOKIE_SAMESITE', 'Strict')
            response.set_cookie(
                key='refresh_token',
                value=refresh_token_str,
                httponly=True,
                secure=secure_cookie,
                samesite=samesite_policy,
                expires=expires_at,
                path='/api/v1/auth/',
            )

            # Delete the raw refresh token string from the JSON payload
            del response.data['refresh']
        
        return response

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Retrieve refresh token from browser cookies or request payload
        refresh_token_str = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        if not refresh_token_str:
            return Response({"detail": "Session cookie or refresh token missing."}, status=status.HTTP_401_UNAUTHORIZED)

        # Validate the token and find its active session before rotating it.
        try:
            old_token = RefreshToken(refresh_token_str)
            old_jti = old_token['jti']
            session = RefreshSession.objects.filter(
                refresh_token_jti=old_jti,
                is_revoked=False,
            ).first()
            if not session:
                return Response(
                    {"detail": "Session is revoked or invalid."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        except (TokenError, InvalidToken):
            return Response(
                {"detail": "Session token invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception:
            return Response(
                {"detail": "Invalid token details."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if session.user.role == User.Role.RESIDENT:
            resident_profile = getattr(session.user, "profile", None)
            if resident_profile is None or not resident_profile.is_verified:
                session.is_revoked = True
                session.save(update_fields=["is_revoked"])
                return Response(
                    {
                        "detail": (
                            "Your resident account is not verified. "
                            "Please contact your barangay administrator."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Let SimpleJWT validate and rotate only after the session passes the guard.
        serializer = self.get_serializer(data={'refresh': refresh_token_str})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken):
            return Response(
                {"detail": "Session token invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        access_token_str = serializer.validated_data.get('access')
        new_refresh_token_str = serializer.validated_data.get('refresh')

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
            samesite_policy = getattr(settings, 'REFRESH_COOKIE_SAMESITE', 'Strict')
            response.set_cookie(
                key='refresh_token',
                value=new_refresh_token_str,
                httponly=True,
                secure=secure_cookie,
                samesite=samesite_policy,
                expires=new_expires_at,
                path='/api/v1/auth/',
            )
            
        return response


class MultiPathCookie(SimpleCookie):
    """
    Subclass of SimpleCookie that preserves multiple Morsels for the same
    cookie name, allowing the response to emit multiple Set-Cookie headers
    (e.g., to expire cookies across multiple paths simultaneously).
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._extra_morsels = []

    def add_cookie(
        self,
        key,
        value="",
        max_age=None,
        expires=None,
        path="/",
        domain=None,
        secure=False,
        httponly=False,
        samesite=None,
    ):
        m = Morsel()
        m.set(key, value, value)
        if max_age is not None:
            m["max-age"] = int(max_age)
        if expires is not None:
            m["expires"] = expires
        if path is not None:
            m["path"] = path
        if domain is not None:
            m["domain"] = domain
        if secure:
            m["secure"] = True
        if httponly:
            m["httponly"] = True
        if samesite:
            m["samesite"] = samesite
        self._extra_morsels.append(m)

    def __len__(self):
        return super().__len__() + len(self._extra_morsels)

    def values(self):
        return list(super().values()) + self._extra_morsels

    def output(self, attrs=None, header="Set-Cookie:", sep="\r\n"):
        lines = []
        if len(super().values()):
            lines.append(super().output(attrs, header, sep))
        for m in self._extra_morsels:
            lines.append(m.output(attrs, header))
        return sep.join(lines)


def extract_refresh_tokens(request):
    """
    Extract all refresh token strings from the incoming request.

    Preserves multiple tokens when the raw HTTP_COOKIE header contains duplicate
    cookie names (such as overlapping / and /api/v1/auth/ paths), preventing
    orphaned database sessions when client browsers submit both cookies.
    """
    tokens = []
    seen = set()

    raw_cookie = request.META.get('HTTP_COOKIE', '')
    if raw_cookie:
        for chunk in raw_cookie.split(';'):
            if '=' in chunk:
                key, val = chunk.split('=', 1)
            else:
                key, val = '', chunk
            key, val = key.strip(), val.strip()
            if key == 'refresh_token' and val:
                unquoted = _unquote(val)
                if unquoted and unquoted not in seen:
                    tokens.append(unquoted)
                    seen.add(unquoted)

    parsed_cookie = request.COOKIES.get('refresh_token')
    if parsed_cookie and parsed_cookie not in seen:
        tokens.append(parsed_cookie)
        seen.add(parsed_cookie)

    try:
        data = getattr(request, 'data', None)
        if isinstance(data, Mapping):
            body_token = data.get('refresh')
            if isinstance(body_token, str) and body_token.strip():
                clean_body_token = body_token.strip()
                if clean_body_token not in seen:
                    tokens.append(clean_body_token)
                    seen.add(clean_body_token)
    except Exception:
        # Malformed or unsupported request bodies must never block cookie-based revocation
        pass

    return tokens


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=None, responses={200: None})
    def post(self, request, *args, **kwargs):
        refresh_tokens = extract_refresh_tokens(request)
        for refresh_token_str in refresh_tokens:
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

        # Always return 200 and clear both scoped (/api/v1/auth/) and legacy (/) cookies
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)

        samesite_policy = getattr(settings, 'REFRESH_COOKIE_SAMESITE', 'Strict')
        secure_cookie = not settings.DEBUG
        if samesite_policy.lower() == 'none':
            secure_cookie = True

        multi_cookies = MultiPathCookie()
        for k, v in response.cookies.items():
            multi_cookies[k] = v
        response.cookies = multi_cookies

        # Expire current scoped cookie (/api/v1/auth/)
        response.delete_cookie('refresh_token', path='/api/v1/auth/', samesite=samesite_policy)
        if secure_cookie:
            multi_cookies['refresh_token']['secure'] = True
        multi_cookies['refresh_token']['httponly'] = True

        # Expire legacy root-path cookie (/)
        multi_cookies.add_cookie(
            key='refresh_token',
            value="",
            max_age=0,
            expires="Thu, 01 Jan 1970 00:00:00 GMT",
            path="/",
            secure=secure_cookie,
            httponly=True,
            samesite=samesite_policy,
        )

        return response
    
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

