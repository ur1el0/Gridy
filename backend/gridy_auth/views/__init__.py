from .authentication import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    LogoutView,
    PasswordResetRequestView,
    PasswordResetConfirmView
)

from .registration import (
    RegisterView,
    AdminRegisterView
)

from .profile import (
    UserProfileView,
    BarangayViewSet
)

from .residents import (
    ResidentImportView,
    PendingResidentsView,
    VerifyResidentView,
    RejectResidentView,
    ResidentViewSet
)