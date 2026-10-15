from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from gridy_audit.models import AuditLog
from gridy_audit.services import log_action
from gridy_auth.models import RefreshSession, User
from gridy_auth.permissions import IsBarangayOfficial
from gridy_auth.serializers.staff import (
    StaffUserCreateSerializer,
    StaffUserListSerializer,
)


@extend_schema(tags=["Staff Management"])
class StaffManagementViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Administrative management for Barangay Field Officials.
    Allows authenticated Barangay Admins to provision, list, and toggle
    active status of field officers strictly within their own Barangay.
    """
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "staff_management"

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or user.role != User.Role.ADMIN or not user.barangay_id:
            return User.objects.none()
        return (
            User.objects.filter(
                barangay_id=user.barangay_id,
                role=User.Role.FIELD_OFFICIAL,
            )
            .order_by("-date_joined")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return StaffUserCreateSerializer
        return StaffUserListSerializer

    @extend_schema(
        summary="List Barangay Field Officials",
        description="Returns all active and inactive Field Officials belonging to the authenticated Admin's Barangay.",
        responses={200: StaffUserListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Onboard New Field Official",
        description="Creates a new Field Official bound to the authenticated Admin's Barangay.",
        request=StaffUserCreateSerializer,
        responses={
            201: StaffUserListSerializer,
            400: OpenApiResponse(description="Validation error or duplicate credentials."),
            403: OpenApiResponse(description="Restricted to Barangay Admins with assigned Barangay."),
        },
    )
    def create(self, request, *args, **kwargs):
        if not request.user.barangay:
            return Response(
                {"detail": "Administrator is not assigned to an active Barangay."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = User(
            username=data["username"],
            email=data["email"].lower(),
            first_name=data["first_name"],
            last_name=data["last_name"],
            role=User.Role.FIELD_OFFICIAL,
            barangay=request.user.barangay,
            is_staff=False,
            is_active=True,
        )
        user.set_password(data["password"])
        user.save()

        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.USER_ACTION,
            description=f"Admin {request.user.username} created field official account '{user.username}' for Barangay {request.user.barangay.name}.",
            request=request,
        )

        read_serializer = StaffUserListSerializer(user)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Toggle Field Official Active Status",
        description="Activates or deactivates a Field Official. Deactivating immediately revokes all active refresh sessions.",
        responses={
            200: StaffUserListSerializer,
            404: OpenApiResponse(description="Field Official not found in administrator's Barangay."),
        },
    )
    @action(detail=True, methods=["post"], url_path="toggle-status")
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])

        if not user.is_active:
            # Immediate session revocation
            RefreshSession.objects.filter(user=user, is_revoked=False).update(is_revoked=True)

        action_word = "activated" if user.is_active else "deactivated"
        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.USER_ACTION,
            description=f"Admin {request.user.username} {action_word} field official account '{user.username}'.",
            request=request,
        )

        serializer = StaffUserListSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
