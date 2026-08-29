from gridy_auth.models import Barangay
from gridy_auth.serializers import ResidentSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer
from django.http import HttpResponseForbidden
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    AdminRegisterSerializer,
    CustomTokenObtainPairSerializer,
)

from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers

import csv
import io
from datetime import datetime
from django.db import transaction
from rest_framework.parsers import MultiPartParser, FormParser
from gridy_auth.permissions import IsBarangayOfficial
from gridy_auth.models import User, Resident
from gridy_auth.serializers import UserSerializer, BarangaySerializer

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.utils import timezone
from datetime import datetime
from django.conf import settings
from .models import RefreshSession

from rest_framework.generics import ListAPIView
from django.shortcuts import get_object_or_404

from rest_framework import viewsets
from gridy_audit.services import get_client_ip, log_action
from gridy_audit.models import AuditLog

from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator

# Create your views here.

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField(help_text="CSV file containing resident accounts to import.")


class ResidentImportResponseSerializer(serializers.Serializer):
    imported = serializers.IntegerField(help_text="Number of residents successfully imported.")
    skipped_due_to_duplicate = serializers.IntegerField(help_text="Number of records skipped due to pre-existing username.")
    errors = serializers.ListField(child=serializers.CharField(), help_text="List of validation error messages.")


@extend_schema(
    summary="Register Resident Account",
    request=RegisterSerializer,
    responses={201: UserSerializer, 400: OpenApiTypes.OBJECT}
)
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Send welcome email asynchronously
            full_name = getattr(user, 'profile', user).full_name if hasattr(user, 'profile') else user.username
            from gridy_auth.tasks import send_welcome_email
            send_welcome_email.delay(user.email, full_name)
            
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Register Administrative Personnel Account",
    request=AdminRegisterSerializer,
    responses={201: UserSerializer, 400: OpenApiTypes.OBJECT}
)
class AdminRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AdminRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            full_name = f"{user.first_name} {user.last_name}".strip() or user.username
            try:
                from gridy_auth.tasks import send_welcome_email
                send_welcome_email.delay(user.email, full_name)
            except Exception:
                pass

            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

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

            # Create session in the databse
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


@extend_schema(
    summary="Get Current User Profile",
    responses={200: UserSerializer}
)
class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status.HTTP_200_OK)

    @extend_schema(
        summary="Update User Profile (Preferences)",
        request=UserSerializer,
        responses={200: UserSerializer, 400: OpenApiTypes.OBJECT}
    )
    
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Permanently Erase User Account (Right to Erasure)",
        responses={204: None}
    )

    def delete(self, request):
        user = request.user

        # Log the voluntary self-deletion for the audit trail before the object is destroyed
        log_action(
            user=user,
            action_type=AuditLog.ActionType.USER_ACTION,
            description=f"User {user.username} (ID: {user.id}) voluntarily exercised their Right to Erasure and permanently deleted their account.",
            request=request
        )

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    summary="Bulk Import Residents from CSV",
    request={
        'multipart/form-data': FileUploadSerializer
    },
    responses={
        200: ResidentImportResponseSerializer,
        207: ResidentImportResponseSerializer,
        400: OpenApiTypes.OBJECT
    }
)
class ResidentImportView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"detail": "No file was uploaded"},
            status=status.HTTP_400_BAD_REQUEST    
        )
        if not file_obj.name.endswith('.csv') :
            return Response({"detail": "File is not a CSV."},
            status=status.HTTP_400_BAD_REQUEST    
        )

        try:
            # Decode file content
            decoded_file = file_obj.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
        except Exception as e:
            return Response({"detail": f"Error reading file: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST    
        )
        imported_count = 0
        skipped_count = 0
        errors = []

        try:
            with transaction.atomic():
                for row_idx, row in enumerate(reader, start=1):
                    username = row.get('username')
                    email = row.get('email', '')
                    full_name = row.get('full_name')
                    birth_date_str = row.get('birth_date')
                    contact_number = row.get('contact_number', '')
                    voter_status_str = row.get('voter_status', 'False')
                    
                    # Validation checks
                    if not username or not full_name or not birth_date_str:
                        errors.append(f"Row {row_idx}: Missing required files ('username', 'full_name', 'birth_date').")
                        continue

                    try:
                        # Parse birth date to validate YYYY-MM-DD format
                        birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
                    except ValueError:
                        errors.append(f"Row {row_idx}: Invalid date format for '{birth_date_str}'. Expected YYYY-MM-DD.")
                        continue

                    if User.objects.filter(username=username).exists():
                        skipped_count += 1
                        continue

                    # Clean voter status
                    voter_status = voter_status_str.strip().lower() in ['true', '1', 'yes']

                    # Initial password is birth_date formatted as YYYYMMDD
                    initial_password = birth_date.strftime('%Y%m%d')

                    # Create user
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password=initial_password,
                        role=User.Role.RESIDENT
                    )

                    # Create resident profile
                    Resident.objects.create(
                        user=user,
                        full_name=full_name,
                        birth_date=birth_date,
                        voter_status=voter_status,
                        contact_number=contact_number,
                    )
                    imported_count += 1
        except Exception as e:
            return Response({"detail": f"Database transaction error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

        response_data = {
            "imported": imported_count,
            "skipped_due_to_duplicate": skipped_count,
            "errors": errors
        }

        if errors:
            return Response(response_data, status=status.HTTP_207_MULTI_STATUS)
        return Response(response_data, status=status.HTTP_200_OK)

class PendingResidentsView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]
    serializer_class = ResidentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.DILG_ADMIN:
            return Resident.objects.filter(is_verified=False)
        return Resident.objects.filter(is_verified=False, user__barangay=user.barangay)

class VerifyResidentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]

    @extend_schema(
        summary="Verify a resident account",
        responses={200: ResidentSerializer, 404: OpenApiTypes.OBJECT}
    )
    def patch(self, request, pk):
        resident = get_object_or_404(Resident, pk=pk)
        resident.is_verified = True
        resident.save()

        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.USER_ACTION,
            description=f"Verified resident account for {resident.full_name} (ID: {resident.id}).",
            request=request
        )

        return Response(ResidentSerializer(resident).data, status=status.HTTP_200_OK)

class RejectResidentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]

    @extend_schema(
        summary="Reject and delete a pending resident account",
        responses={204: None, 404: OpenApiTypes.OBJECT}
    )
    def delete(self, request, pk):
        resident = get_object_or_404(Resident, pk=pk)
        
        # Save info before deletion for the audit log
        resident_name = resident.full_name
        resident_id = resident.id

        user = resident.user
        user.delete() # This cascades and deletes the Resident profile

        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.USER_ACTION,
            description=f"Rejected and deleted pending resident account for {resident_name} (ID: {resident_id}).",
            request=request
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

class ResidentViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoint for verified residents.
    Only Barangay Officials can access this full directory.
    """

    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]
    serializer_class = ResidentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.DILG_ADMIN:
            return Resident.objects.filter(is_verified=True).select_related('user').order_by('full_name')
            # Isolate by the admin's barangay
        return Resident.objects.filter(is_verified=True, user__barangay=user.barangay).select_related('user').order_by('full_name')

class BarangayViewSet(viewsets.ModelViewSet):
    """
    Settings endpoint for Barangay Identity.
    Only allows GET and PATCH
    """

    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]
    serializer_class = BarangaySerializer
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ['get', 'patch']

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.DILG_ADMIN:
            return Barangay.objects.all().order_by('name')

        # Isolate to the official's own barangay
        if user.barangay:
            return Barangay.objects.filter(id=user.barangay.id)
        return Barangay.objects.none()
    

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny] # Anyone can request a reset

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
                # 1. Generate cryptographic token and encode User ID
                uid = urlsafe_base64_decode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)

                # 2. Construct the Magical Link pointing to React Frontend
                reset_link = f"http://localhost:5173/reset-password?uidb64={uid}&token={token}"

                # 3. Fire the Email
                send_mail(
                    subject="Gridy: Password Reset Request",
                    message=f"Hello, \n,\nYou requested a password reset. Click the link below to set a new password:\n\n{reset_link}\n\nIf your did not request this, please ignore this email.",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
            
            # SECURITY CONCEPT: We always return 200 Success even if the email DOES NOT exist.
            # This prevents hackers from guessing which emails belong to our system (Email Enumeration Attack)
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