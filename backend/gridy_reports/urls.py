from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IssueReportViewSet

router = DefaultRouter()
router.register(r'reports', IssueReportViewSet, basename='issue-report')

urlpatterns = [
    path('', include(router.urls)),
]