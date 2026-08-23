from rest_framework.permissions import BasePermission
from .models import User


class IsBarangayOfficial(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and
            request.user.role == User.Role.ADMIN
        )

class IsResident(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.RESIDENT
        )

class IsDILGAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == User.Role.DILG_ADMIN
        )