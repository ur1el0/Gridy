from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiTypes

from gridy_auth.models import Barangay, User
from gridy_auth.serializers import UserSerializer, BarangaySerializer
from gridy_auth.permissions import IsBarangayOfficial
from gridy_audit.services import log_action
from gridy_audit.models import AuditLog

@extend_schema(tags=['User Profile'])
class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status.HTTP_200_OK)
    
    @extend_schema(
        summary="Update User Profile (Preferences)",
        request=UserSerializer,
        responses={200: UserSerializer, 400:OpenApiTypes.OBJECT}
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