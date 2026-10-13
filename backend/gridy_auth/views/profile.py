import json
import uuid

from django.db import transaction
from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema, OpenApiTypes

from gridy_auth.models import Barangay, User, RefreshSession
from gridy_auth.serializers import UserSerializer, BarangaySerializer
from gridy_auth.permissions import IsBarangayOfficial
from gridy_audit.services import log_action
from gridy_audit.models import AuditLog

@extend_schema(tags=['User Profile'])
class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    PROFILE_FIELD_NAMES = {
        'full_name',
        'birth_date',
        'voter_status',
        'contact_number',
        'purok',
        'philsys_id_number',
        'philsys_id_photo',
        'remove_philsys_id_photo',
        'secondary_id_type',
        'secondary_id_photo',
        'remove_secondary_id_photo',
        'utility_billing_type',
        'utility_billing_photo',
        'remove_utility_billing_photo',
    }

    def _normalize_request_data(self, request):
        raw_data = request.data
        if hasattr(raw_data, 'dict'):
            data = {}
            for key in raw_data.keys():
                if key in request.FILES:
                    data[key] = request.FILES.get(key)
                else:
                    data[key] = raw_data.get(key)
        elif isinstance(raw_data, dict):
            data = dict(raw_data)
            for key, file_obj in request.FILES.items():
                data[key] = file_obj
        else:
            return raw_data

        profile_data = {}
        raw_profile = data.get('profile')
        if isinstance(raw_profile, str):
            try:
                raw_profile = json.loads(raw_profile)
            except Exception:
                raw_profile = {}
        if isinstance(raw_profile, dict):
            profile_data.update(raw_profile)

        keys_to_remove = []
        for key, val in list(data.items()):
            if key == 'profile':
                continue
            if key.startswith('profile.') or key.startswith('profile['):
                clean_key = key.removeprefix('profile.').removeprefix('profile[').rstrip(']')
                profile_data[clean_key] = val
                keys_to_remove.append(key)
            elif key in self.PROFILE_FIELD_NAMES and key not in profile_data:
                profile_data[key] = val
                keys_to_remove.append(key)

        for key in keys_to_remove:
            data.pop(key, None)

        if profile_data or 'profile' in data:
            data['profile'] = profile_data

        return data

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status.HTTP_200_OK)
    
    @extend_schema(
        summary="Update User Profile (Preferences)",
        request=UserSerializer,
        responses={200: UserSerializer, 400:OpenApiTypes.OBJECT}
    )
    def patch(self, request):
        normalized_data = self._normalize_request_data(request)
        serializer = UserSerializer(request.user, data=normalized_data, partial=True)
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
        user_id = user.id

        with transaction.atomic():
            # 1. Audit log before anonymization, preserving audit trail without retaining actor linkage or sensitive PII
            log_action(
                user=None,
                action_type=AuditLog.ActionType.USER_ACTION,
                description=f"User (ID: {user_id}) voluntarily exercised Right to Erasure; account deactivated and credentials anonymized.",
                request=request
            )

            # 2. Deactivate account and anonymize credentials
            anon_token = uuid.uuid4().hex[:12]
            user.is_active = False
            user.username = f"erased_{user_id}_{anon_token}"
            user.email = f"erased_{user_id}_{anon_token}@erased.local"
            user.first_name = ""
            user.last_name = ""
            user.set_unusable_password()
            user.save(update_fields=['is_active', 'username', 'email', 'first_name', 'last_name', 'password'])

            # 3. Revoke all active refresh sessions
            RefreshSession.objects.filter(user=user).delete()

            # 4. Schedule safe cleanup of private identity proof files on commit & delete Resident profile
            if hasattr(user, 'profile'):
                profile = user.profile
                for proof in [profile.philsys_id_photo, profile.secondary_id_photo, profile.utility_billing_photo]:
                    if proof and proof.name:
                        p_storage = proof.storage
                        p_name = proof.name

                        def _safe_delete(s=p_storage, n=p_name):
                            try:
                                s.delete(n)
                            except Exception:
                                pass

                        transaction.on_commit(_safe_delete)
                profile.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
    
@extend_schema(tags=['Barangay Settings'])
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