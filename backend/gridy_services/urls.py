from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentRequestViewSet, QueueTicketViewSet, DashboardSummaryView, PublicQueueStatusView
from .analytics import DILGAnalyticsView

router = DefaultRouter()
router.register(r'document-requests', DocumentRequestViewSet, basename='document-request')
router.register(r'tickets', QueueTicketViewSet, basename='ticket')

urlpatterns = [
    path('', include(router.urls)),
    path('public/barangays/<int:barangay_id>/queue-status/', PublicQueueStatusView.as_view(), name='public-queue-status'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('dilg-analytics/', DILGAnalyticsView.as_view(), name='dilg-analytics'),
]