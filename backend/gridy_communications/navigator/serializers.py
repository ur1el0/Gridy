"""
Serializers for the Public Information AI Navigator API.
"""

from collections.abc import Mapping
from rest_framework import serializers


class NavigatorQueryRequestSerializer(serializers.Serializer):
    """
    Validates single-turn query payload from authenticated residents.
    Rejects any unapproved or extra fields (e.g. tenant overrides, user IDs, history).
    Handles both JSON dictionaries and form-encoded QueryDict mappings.
    """

    query = serializers.CharField(
        max_length=500,
        min_length=1,
        trim_whitespace=True,
        help_text="Resident inquiry regarding public barangay procedures, documents, activities, or contacts (1-500 characters).",
    )

    def validate(self, attrs):
        if isinstance(self.initial_data, Mapping):
            disallowed = set(self.initial_data.keys()) - {"query"}
            if disallowed:
                raise serializers.ValidationError(
                    f"Unexpected fields in request payload: {', '.join(sorted(disallowed))}. Only 'query' is permitted."
                )
        return attrs


class NavigatorSourceSerializer(serializers.Serializer):
    """
    Represents an approved, cited source record.
    """

    id = serializers.CharField(help_text="Identifier of the cited public source record.")
    title = serializers.CharField(help_text="Official title or label of the public source.")
    category = serializers.CharField(help_text="Category of information (e.g. statutory, announcement, hotline, contact).")
    reference = serializers.CharField(help_text="Official reference citation or legal basis.")
    updated_at = serializers.DateTimeField(allow_null=True, required=False, help_text="Timestamp of source record creation or update.")


class NavigatorEscalationHotlineSerializer(serializers.Serializer):
    """
    Represents an active emergency hotline available for direct escalation.
    """

    name = serializers.CharField(help_text="Name of the department or service.")
    number = serializers.CharField(help_text="Phone number.")
    category = serializers.CharField(help_text="Emergency category.")


class NavigatorEscalationSerializer(serializers.Serializer):
    """
    Structured escalation block directing the resident to verified official channels.
    """

    office_contact = serializers.CharField(
        allow_null=True,
        help_text="Verified office address or phone number for the resident's assigned Barangay Hall.",
    )
    hotlines = NavigatorEscalationHotlineSerializer(
        many=True,
        help_text="List of active same-Barangay emergency hotlines.",
    )
    barangay_hall_notice = serializers.CharField(
        help_text="Instructions directing the resident to in-person Barangay Hall assistance.",
    )


class NavigatorQueryResponseSerializer(serializers.Serializer):
    """
    Top-level response payload for the Public Information AI Navigator.
    """

    status = serializers.ChoiceField(
        choices=["answered", "abstained", "unavailable"],
        help_text="Outcome status of the inquiry.",
    )
    answer = serializers.CharField(
        help_text="Conversational response or abstention advisory for the resident.",
    )
    reason = serializers.CharField(
        allow_null=True,
        required=False,
        help_text="Machine-readable classification code (privacy_concern, unsupported_query, no_eligible_sources, invalid_citations, feature_disabled).",
    )
    sources = NavigatorSourceSerializer(
        many=True,
        help_text="List of verified, cited source records supporting the answer.",
    )
    escalation = NavigatorEscalationSerializer(
        help_text="Verified Barangay contacts and in-person escalation channels.",
    )
