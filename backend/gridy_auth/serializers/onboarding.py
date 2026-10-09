from django.db.models import Q
from rest_framework import serializers

from gridy_auth.models import Barangay, BarangayApplication


class PublicBarangaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Barangay
        fields = ["id", "name", "municipality", "province", "primary_color"]
        read_only_fields = fields


class BarangayApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BarangayApplication
        fields = [
            "id",
            "name",
            "municipality",
            "province",
            "applicant_name",
            "applicant_position",
            "applicant_email",
            "applicant_phone",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        for field in ("name", "municipality", "province", "applicant_name", "applicant_position"):
            attrs[field] = attrs[field].strip()
        attrs["applicant_email"] = attrs["applicant_email"].strip().lower()
        attrs["applicant_phone"] = attrs["applicant_phone"].strip()

        locality = {
            f"{field}__iexact": attrs[field]
            for field in ("name", "municipality", "province")
        }
        if Barangay.objects.filter(**locality).exists() or BarangayApplication.objects.filter(
            **locality,
            status=BarangayApplication.Status.PENDING,
        ).exists():
            raise serializers.ValidationError({
                "name": "This barangay is already onboarded or has an application pending review."
            })
        return attrs


class BarangayApplicationReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=(BarangayApplication.Status.APPROVED, BarangayApplication.Status.REJECTED)
    )
    review_note = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    def validate(self, attrs):
        if attrs["status"] == BarangayApplication.Status.REJECTED and not attrs.get("review_note"):
            raise serializers.ValidationError({
                "review_note": "A reason is required when rejecting an application."
            })
        return attrs


class BarangayApplicationReadSerializer(serializers.ModelSerializer):
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.username",
        read_only=True,
        allow_null=True,
    )
    barangay_name = serializers.CharField(
        source="created_barangay.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = BarangayApplication
        fields = [
            "id",
            "name",
            "municipality",
            "province",
            "applicant_name",
            "applicant_position",
            "applicant_email",
            "applicant_phone",
            "status",
            "review_note",
            "reviewed_by_name",
            "reviewed_at",
            "barangay_name",
            "created_at",
        ]
        read_only_fields = fields
