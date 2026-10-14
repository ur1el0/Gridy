"""
Public Information AI Navigator package.
"""

from gridy_communications.navigator.catalog import STATUTORY_CATALOG
from gridy_communications.navigator.guard import (
    GuardResult,
    check_privacy_and_intent,
    contains_sensitive_data,
    contains_ph_phone_number,
    contains_email_address,
    is_source_content_safe,
)
from gridy_communications.navigator.retrieval import (
    retrieve_public_sources,
    build_escalation_data,
    format_available_sources_fallback,
    is_valid_office_contact,
    truncate_to_limit,
    MAX_ANNOUNCEMENT_CONTENT_CHARS,
    MAX_ACTIVITY_CONTENT_CHARS,
    MAX_AGGREGATE_SOURCE_BUNDLE_CHARS,
)
from gridy_communications.navigator.prompt import build_navigator_prompt
from gridy_communications.navigator.provider import (
    GeminiNavigatorProvider,
    get_navigator_provider,
    ProviderError,
    ProviderTimeoutError,
    ProviderNetworkError,
    ProviderServerError,
    ProviderQuotaError,
    ProviderMalformedOutputError,
)
from gridy_communications.navigator.permissions import IsResidentWithBarangay
from gridy_communications.navigator.serializers import (
    NavigatorQueryRequestSerializer,
    NavigatorQueryResponseSerializer,
    NavigatorSourceSerializer,
    NavigatorEscalationSerializer,
)

__all__ = [
    "STATUTORY_CATALOG",
    "GuardResult",
    "check_privacy_and_intent",
    "contains_sensitive_data",
    "contains_ph_phone_number",
    "contains_email_address",
    "is_source_content_safe",
    "retrieve_public_sources",
    "build_escalation_data",
    "format_available_sources_fallback",
    "is_valid_office_contact",
    "truncate_to_limit",
    "MAX_ANNOUNCEMENT_CONTENT_CHARS",
    "MAX_ACTIVITY_CONTENT_CHARS",
    "MAX_AGGREGATE_SOURCE_BUNDLE_CHARS",
    "build_navigator_prompt",
    "GeminiNavigatorProvider",
    "get_navigator_provider",
    "ProviderError",
    "ProviderTimeoutError",
    "ProviderNetworkError",
    "ProviderServerError",
    "ProviderQuotaError",
    "ProviderMalformedOutputError",
    "IsResidentWithBarangay",
    "NavigatorQueryRequestSerializer",
    "NavigatorQueryResponseSerializer",
    "NavigatorSourceSerializer",
    "NavigatorEscalationSerializer",
]
