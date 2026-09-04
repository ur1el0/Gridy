from django.urls import path, include
from rest_framework.routers import DefaultRouter
from gridy_communications.views import (
    AnnouncementViewSet,
    ActivityScheduleViewSet, 
    FCMDeviceViewSet, 
    EmergencyHotlineViewSet,
    FAQViewSet,
    AdminNotificationViewSet
)

router = DefaultRouter()
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'activities', ActivityScheduleViewSet, basename='activity')
router.register(r'devices', FCMDeviceViewSet, basename='fcm-device')
router.register(r'hotlines', EmergencyHotlineViewSet, basename='hotline')
router.register(r'faqs', FAQViewSet, basename='faq')
router.register(r'admin-notifications', EmergencyHotlineViewSet, basename='admin-notification')

urlpatterns = [
    path('', include(router.urls)),
]