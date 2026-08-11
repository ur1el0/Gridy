from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentRequestViewSet, QueueTicketViewSet, DashboardSummaryView

router = DefaultRouter()
router.register(r'document-requests', DocumentRequestViewSet, basename='document-request')
router.register(r'tickets', QueueTicketViewSet, basename='ticket')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary')
]