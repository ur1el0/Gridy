"""
Role-based and tenant authorization permissions for the Public Information AI Navigator.
"""

from rest_framework import permissions
from gridy_auth.models import User


class IsResidentWithBarangay(permissions.BasePermission):
    """
    Enforces that the caller is an authenticated Resident who possesses
    an active Resident profile and an assigned Barangay foreign key.

    Anonymous users are handled by IsAuthenticated (HTTP 401).
    Authenticated users failing these checks receive HTTP 403 Forbidden.
    """

    message = "Access restricted to authenticated residents with an assigned Barangay and profile."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.role != User.Role.RESIDENT:
            return False

        if not hasattr(user, "profile") or user.profile is None:
            return False

        if not user.barangay_id:
            return False

        return True
