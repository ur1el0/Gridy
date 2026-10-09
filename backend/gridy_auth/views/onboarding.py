import re

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from gridy_audit.models import AuditLog
from gridy_audit.services import log_action
from gridy_auth.models import Barangay, BarangayApplication, User
from gridy_auth.permissions import IsDILGAdmin
from gridy_auth.serializers.onboarding import (
    BarangayApplicationCreateSerializer,
    BarangayApplicationReadSerializer,
    BarangayApplicationReviewSerializer,
    PublicBarangaySerializer,
)
from gridy_auth.tasks import send_barangay_approval_email


@extend_schema(tags=["Barangay Directory"])
class PublicBarangayDirectoryView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses=PublicBarangaySerializer(many=True))
    def get(self, request):
        barangays = Barangay.objects.all().order_by("province", "municipality", "name")
        return Response(PublicBarangaySerializer(barangays, many=True).data)


@extend_schema(tags=["Barangay Onboarding"])
class BarangayApplicationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = BarangayApplication.objects.select_related("reviewed_by", "created_barangay")
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "barangay_application"

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsDILGAdmin()]

    def get_serializer_class(self):
        if self.action == "create":
            return BarangayApplicationCreateSerializer
        if self.action == "review":
            return BarangayApplicationReviewSerializer
        return BarangayApplicationReadSerializer

    def get_throttles(self):
        if self.action == "create":
            return [ScopedRateThrottle()]
        return []

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role == User.Role.DILG_ADMIN:
            return self.queryset
        return BarangayApplication.objects.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return Response(
            {
                "id": application.pk,
                "detail": "Application received. DILG must verify it before an account or barangay is created.",
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="review")
    def review(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        decision = serializer.validated_data["status"]
        review_note = serializer.validated_data.get("review_note", "")

        with transaction.atomic():
            application = get_object_or_404(
                self.get_queryset().select_for_update(of=("self",)),
                pk=pk,
            )
            if application.status != BarangayApplication.Status.PENDING:
                raise ValidationError({"status": "Only pending applications can be reviewed."})

            if decision == BarangayApplication.Status.APPROVED:
                locality = {
                    f"{field}__iexact": getattr(application, field)
                    for field in ("name", "municipality", "province")
                }
                barangays = Barangay.objects.select_for_update()
                if barangays.filter(**locality).exists():
                    raise ValidationError({
                        "name": "A barangay with this locality is already onboarded."
                    })
                if User.objects.filter(email__iexact=application.applicant_email).exists():
                    raise ValidationError({
                        "applicant_email": "This email already belongs to an account. Resolve that account before approving."
                    })

                legacy_matches = list(
                    barangays.filter(name__iexact=application.name)
                    .filter(
                        Q(municipality="")
                        | Q(municipality__iexact=application.municipality),
                        Q(province="") | Q(province__iexact=application.province),
                    )[:2]
                )
                if len(legacy_matches) > 1:
                    raise ValidationError({
                        "name": "More than one incomplete barangay record matches this name. Resolve the existing records before approval."
                    })

                if legacy_matches:
                    barangay = legacy_matches[0]
                    barangay.municipality = application.municipality
                    barangay.province = application.province
                    barangay.save(update_fields=["municipality", "province"])
                else:
                    barangay = Barangay.objects.create(
                        name=application.name,
                        municipality=application.municipality,
                        province=application.province,
                    )
                username_base = slugify(application.applicant_email.split("@", 1)[0])
                username_base = re.sub(r"[^a-zA-Z0-9._-]", "", username_base)[:130]
                username_base = username_base or "barangay-official"
                username = username_base
                suffix = 1
                while User.objects.filter(username__iexact=username).exists():
                    username = f"{username_base[:140]}-{suffix}"
                    suffix += 1

                name_parts = application.applicant_name.split(maxsplit=1)
                official = User.objects.create_user(
                    username=username,
                    email=application.applicant_email,
                    password=None,
                    first_name=name_parts[0],
                    last_name=name_parts[1] if len(name_parts) > 1 else "",
                    role=User.Role.ADMIN,
                    barangay=barangay,
                    is_staff=True,
                    is_active=True,
                )
                application.created_barangay = barangay
                transaction.on_commit(
                    lambda: send_barangay_approval_email.delay(
                        official.email,
                        application.applicant_name,
                        barangay.name,
                    )
                )

            application.status = decision
            application.review_note = review_note
            application.reviewed_by = request.user
            application.reviewed_at = timezone.now()
            application.save(
                update_fields=[
                    "status",
                    "review_note",
                    "reviewed_by",
                    "reviewed_at",
                    "created_barangay",
                    "updated_at",
                ]
            )
            log_action(
                user=request.user,
                action_type=AuditLog.ActionType.USER_ACTION,
                description=(
                    f"{decision.title()} barangay onboarding application #{application.pk} "
                    f"for {application.name}, {application.municipality}, {application.province}."
                    + (f" Review note: {review_note}" if review_note else "")
                ),
                request=request,
            )

        return Response(
            BarangayApplicationReadSerializer(application).data,
            status=status.HTTP_200_OK,
        )
