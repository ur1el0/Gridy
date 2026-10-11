"""
Authentication view facade for backwards compatibility.
Domain views are partitioned into token.py, logout.py, password_reset.py, and sessions.py.
"""
from .logout import LogoutView, MultiPathCookie, extract_refresh_tokens
from .password_reset import PasswordResetConfirmView, PasswordResetRequestView
from .sessions import SessionViewSet
from .token import CustomTokenObtainPairView, CustomTokenRefreshView

__all__ = [
    "CustomTokenObtainPairView",
    "CustomTokenRefreshView",
    "LogoutView",
    "MultiPathCookie",
    "PasswordResetConfirmView",
    "PasswordResetRequestView",
    "SessionViewSet",
    "extract_refresh_tokens",
]
