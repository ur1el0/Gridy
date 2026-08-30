from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    SessionViewSet,
    RegisterView, 
    AdminRegisterView,
    CustomTokenObtainPairView, 
    ResidentImportView, 
    UserProfileView, 
    CustomTokenRefreshView,
    LogoutView,
    PendingResidentsView,
    VerifyResidentView,
    RejectResidentView,
    ResidentViewSet,
    BarangayViewSet,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

router = DefaultRouter()
router.register(r'resident', ResidentViewSet, basename='resident')
router.register(r'barangay', BarangayViewSet, basename='barangay')
router.register(r"sessions", SessionViewSet, basename="session")


urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('register/admin/', AdminRegisterView.as_view(), name='auth_register_admin'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='auth_token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('me/', UserProfileView.as_view(), name='auth_me'),
    path('import-residents/', ResidentImportView.as_view(), name='import_residents'),
    path('pending-residents/', PendingResidentsView.as_view(), name='pending_residents'),
    path('verify-resident/<int:pk>/', VerifyResidentView.as_view(), name='verify_resident'),
    path('reject-resident/<int:pk>/', RejectResidentView.as_view(), name='reject_resident'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
] + router.urls
