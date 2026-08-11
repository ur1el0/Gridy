from gridy_auth.views import UserProfileView
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    CustomTokenObtainPairView, 
    ResidentImportView, 
    UserProfileView, 
    CustomTokenRefreshView,
    LogoutView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='auth_token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('me/', UserProfileView.as_view(), name='auth_me'),
    path('import-residents/', ResidentImportView.as_view(), name='import_residents'),
]
