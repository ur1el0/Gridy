import logging
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework.throttling import ScopedRateThrottle
from drf_spectacular.utils import extend_schema, OpenApiResponse
from gridy_auth.models import User
from gridy_auth.permissions import IsBarangayOfficial, IsDILGAdmin
from gridy_communications.models import (
    Announcement,
    ActivitySchedule,
    FCMDevice,
    EmergencyHotline,
    FAQ,
    AdminNotification,
)
from gridy_communications.serializers import (
    AnnouncementSerializer,
    PublicAnnouncementSerializer,
    ActivityScheduleSerializer,
    FCMDeviceSerializer,
    EmergencyHotlineSerializer,
    FAQSerializer,
    AdminNotificationSerializer,
)
from gridy_communications.tasks import async_send_fcm_topic_notification
from gridy_communications.navigator import (
    check_privacy_and_intent,
    retrieve_public_sources,
    build_escalation_data,
    format_available_sources_fallback,
    get_navigator_provider,
    IsResidentWithBarangay,
    NavigatorQueryRequestSerializer,
    NavigatorQueryResponseSerializer,
    ProviderError,
    ProviderTimeoutError,
    ProviderQuotaError,
)

logger = logging.getLogger(__name__)


class PublicAnnouncementListView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses=PublicAnnouncementSerializer(many=True))
    def get(self, request, barangay_id):
        announcements = Announcement.objects.filter(
            created_by__barangay_id=barangay_id,
        ).order_by("-is_pinned", "-created_at")[:50]
        return Response(
            PublicAnnouncementSerializer(
                announcements,
                many=True,
                context={"request": request},
            ).data
        )

class ActivityScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ActivityScheduleSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return ActivitySchedule.objects.none()
            
        if user.role == User.Role.DILG_ADMIN:
            return ActivitySchedule.objects.all().order_by('event_datetime', 'created_at')

        if not user.barangay_id:
            return ActivitySchedule.objects.none()
            
        return ActivitySchedule.objects.filter(created_by__barangay_id=user.barangay_id).order_by('event_datetime', 'created_at')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Anyone logged in (Resident or Official) can read
            return [permissions.IsAuthenticated()]
        # Only officials can write (create, update, delete)
        return [IsBarangayOfficial()]

    def perform_create(self, serializer):
        user = self.request.user
        if not user.barangay_id:
            raise PermissionDenied("A barangay assignment is required to schedule activities.")
        serializer.save(created_by=user)



class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Announcement.objects.none()
            
        if user.role == User.Role.DILG_ADMIN:
            return Announcement.objects.all().order_by('-is_pinned', '-created_at')

        if not user.barangay_id:
            return Announcement.objects.none()
            
        return Announcement.objects.filter(created_by__barangay_id=user.barangay_id).order_by('-is_pinned', '-created_at')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsBarangayOfficial()]

    def perform_create(self, serializer):
        user = self.request.user
        if not user.barangay_id:
            raise PermissionDenied("A barangay assignment is required to publish announcements.")
        instance = serializer.save(created_by=user)
        try:
            # Add .delay to push this to Celery queue
            async_send_fcm_topic_notification.delay(
                topic="announcements",
                title="New Announcement",
                body=instance.title,
                data={"announcement_id": str(instance.id)}
            )
        except Exception as e:
            logger.error(
                "Announcement FCM notification failed for record %s (%s).",
                instance.id,
                type(e).__name__,
            )

class FCMDeviceViewSet(viewsets.ModelViewSet):
    serializer_class = FCMDeviceSerializer
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return FCMDevice.objects.none()
            
        # Security: Everyone (even Admins) should only be able to view/manage THEIR OWN mobile devices
        return FCMDevice.objects.filter(user=user)

    # Clean up any existing records matching the token to prevent duplicate key crashes 
    def create(self, request, *args, **kwargs):
        token = request.data.get('token')
        if token:
            FCMDevice.objects.filter(token=token).delete()
        return super().create(request, *args, **kwargs)

    # Security: Force the device to belong to the logged-in user!
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class EmergencyHotlineViewSet(viewsets.ModelViewSet):
    serializer_class = EmergencyHotlineSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return EmergencyHotline.objects.none()
        
        if user.role == User.Role.DILG_ADMIN:
            return EmergencyHotline.objects.all()

        if not user.barangay_id:
            return EmergencyHotline.objects.none()
        
        # Base query: scope to the user's barangay
        qs = EmergencyHotline.objects.filter(created_by__barangay_id=user.barangay_id)

        # Security: Residents only see the active hotlines; Officials see everything (to toggle them)
        if user.role == User.Role.RESIDENT:
            qs = qs.filter(is_active=True)

        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Residents can read the hotline directory
            return [permissions.IsAuthenticated()]
        # Only Officials can manage (create, edit, delete)
        return [IsBarangayOfficial()]
    
    def perform_create(self, serializer):
        user = self.request.user
        if not user.barangay_id:
            raise PermissionDenied("A barangay assignment is required to create emergency hotlines.")
        serializer.save(created_by=user)

class FAQViewSet(viewsets.ModelViewSet):
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer

    def get_permissions(self):
        # Anyone authenticated can read FAQs, but only DILG Admins can create/edit them
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsDILGAdmin()]
    
class AdminNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = AdminNotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]

    def get_queryset(self):
        # SECURITY: Admins can ONLY see their own personal notifications
        return AdminNotification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        # Custom endpoint to clear the notification bell badge
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"status": "success", "message": "All notifications marked as read."})


class NavigatorQueryView(APIView):
    """
    Authenticated, tenant-scoped conversational navigator for public barangay information.
    Answers inquiries using exclusively approved local sources and statutory catalogs.
    """

    permission_classes = [permissions.IsAuthenticated, IsResidentWithBarangay]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_navigator"

    @extend_schema(
        request=NavigatorQueryRequestSerializer,
        responses={
            200: NavigatorQueryResponseSerializer,
            400: OpenApiResponse(description="Invalid request payload or unauthorized parameters."),
            401: OpenApiResponse(description="Authentication credentials were not provided or are invalid."),
            403: OpenApiResponse(description="Access restricted to authenticated residents with an assigned Barangay."),
            429: OpenApiResponse(description="Query rate limit exceeded (10 requests per minute)."),
        },
        description=(
            "Queries the Public Information AI Navigator for verified barangay procedures, "
            "document requirements, statutory fee exemptions, activities, and emergency contacts. "
            "Tenant scope is strictly derived from the authenticated resident's profile."
        ),
    )
    def post(self, request, *args, **kwargs):
        # 1. Validate request payload (reject extra fields or oversized queries)
        serializer = NavigatorQueryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        query = serializer.validated_data["query"]

        barangay_id = request.user.barangay_id
        escalation = build_escalation_data(barangay_id)

        # 2. Run deterministic pre-provider privacy and intent guard
        guard_result = check_privacy_and_intent(query)
        if guard_result.triggered:
            response_data = {
                "status": "abstained",
                "answer": guard_result.message,
                "reason": guard_result.reason,
                "sources": [],
                "escalation": escalation,
            }
            return Response(response_data, status=status.HTTP_200_OK)
        # 3. Retrieve approved public sources scoped strictly to the resident's barangay
        sources_dict = retrieve_public_sources(barangay_id)

        # 4. Check if feature is enabled in settings
        if not getattr(settings, "PUBLIC_NAVIGATOR_ENABLED", False):
            response_data = {
                "status": "unavailable",
                "answer": (
                    "The Public Information AI Navigator is currently offline for maintenance. "
                    "Please refer to the verified contacts below or visit the Barangay Hall for assistance."
                ),
                "reason": "feature_disabled",
                "sources": format_available_sources_fallback(sources_dict),
                "escalation": escalation,
            }
            return Response(response_data, status=status.HTTP_200_OK)

        # 5. Check provider configuration
        provider = get_navigator_provider()
        if not provider.is_configured():
            response_data = {
                "status": "unavailable",
                "answer": (
                    "The Public Information AI Navigator service is currently unconfigured. "
                    "Please refer to the verified contacts below or visit the Barangay Hall for official information."
                ),
                "reason": "provider_unconfigured",
                "sources": format_available_sources_fallback(sources_dict),
                "escalation": escalation,
            }
            return Response(response_data, status=status.HTTP_200_OK)

        # 6. Call provider adapter
        sources_list = list(sources_dict.values())
        try:
            provider_result = provider.generate_answer(query, sources_list)
        except ProviderTimeoutError:
            response_data = {
                "status": "unavailable",
                "answer": (
                    "The navigator request timed out. Please try your question again or contact the Barangay Hall."
                ),
                "reason": "provider_timeout",
                "sources": format_available_sources_fallback(sources_dict),
                "escalation": escalation,
            }
            return Response(response_data, status=status.HTTP_200_OK)
        except ProviderQuotaError:
            response_data = {
                "status": "unavailable",
                "answer": (
                    "The navigator service is temporarily experiencing high inquiry volume. Please try again in a few minutes."
                ),
                "reason": "provider_quota_exceeded",
                "sources": format_available_sources_fallback(sources_dict),
                "escalation": escalation,
            }
            return Response(response_data, status=status.HTTP_200_OK)
        except ProviderError:
            response_data = {
                "status": "unavailable",
                "answer": (
                    "The navigator could not connect to the information service at this time. "
                    "Please consult the verified contacts below or visit the Barangay Hall."
                ),
                "reason": "provider_error",
                "sources": format_available_sources_fallback(sources_dict),
                "escalation": escalation,
            }
            return Response(response_data, status=status.HTTP_200_OK)

        # 7. Validate provider output citations against the exact request bundle
        res_status = provider_result.get("status", "abstained")
        res_answer = provider_result.get("answer", "")
        res_reason = provider_result.get("reason")
        cited_ids = provider_result.get("cited_sources", [])

        if res_status == "answered":
            # Must have at least one valid cited source and all cited IDs must exist in sources_dict
            valid_citations = cited_ids and all(cid in sources_dict for cid in cited_ids)
            if not valid_citations:
                response_data = {
                    "status": "abstained",
                    "answer": (
                        "I cannot verify that answer from official public records for your Barangay. "
                        "Please verify directly with the Barangay Hall."
                    ),
                    "reason": "invalid_citations",
                    "sources": [],
                    "escalation": escalation,
                }
                return Response(response_data, status=status.HTTP_200_OK)

            # Grounded citations verified
            verified_sources = [
                {
                    "id": sources_dict[cid]["id"],
                    "title": sources_dict[cid]["title"],
                    "category": sources_dict[cid]["category"],
                    "reference": sources_dict[cid].get("reference", ""),
                    "updated_at": sources_dict[cid].get("updated_at"),
                }
                for cid in cited_ids
            ]
            response_data = {
                "status": "answered",
                "answer": res_answer,
                "reason": None,
                "sources": verified_sources,
                "escalation": escalation,
            }
            return Response(response_data, status=status.HTTP_200_OK)

        # If abstained by provider
        response_data = {
            "status": "abstained",
            "answer": res_answer or (
                "The requested information is not available in approved public records for your Barangay. "
                "Please contact the Barangay Hall for official assistance."
            ),
            "reason": res_reason or "no_eligible_sources",
            "sources": [],
            "escalation": escalation,
        }
        return Response(response_data, status=status.HTTP_200_OK)
