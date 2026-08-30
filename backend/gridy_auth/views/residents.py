import csv
import io
from datetime import datetime
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiTypes

from gridy_auth.models import User, Resident
from gridy_auth.serializers import ResidentSerializer
from gridy_auth.permissions import IsBarangayOfficial
from gridy_audit.services import log_action
from gridy_audit.models import AuditLog

from rest_framework import serializers


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField(help_text="CSV file containing resident accounts to import.")

class ResidentImportResponseSerializer(serializers.Serializer):
    imported = serializers.IntegerField(help_text="Number of residents successfully imported.")
    skipped_due_to_duplicate = serializers.IntegerField(help_text="Number of records skipped due to pre-existing username.")
    errors = serializers.ListField(child=serializers.CharField(), help_text="List of validation error messages.")


@extend_schema(
    summary="Bulk Import Residents from CSV",
    request={
        'multipart/form-data': FileUploadSerializer
    },
    responses={
        200: ResidentImportResponseSerializer,
        207: ResidentImportResponseSerializer,
        400: OpenApiTypes.OBJECT
    }
)

class ResidentImportView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"detail": "No file was uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        if not file_obj.name.endswith('.csv'):
            return Response({"detail": "File is not a CSV."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_file = file_obj.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
        except Exception as e:
            return Response({"detail": f"Error reading file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        imported_count = 0
        skipped_count = 0
        errors = []

        try:
            with transaction.atomic():
                for row_idx, row in enumerate(reader, start=1):
                    username = row.get('username')
                    email = row.get('email', '')
                    full_name = row.get('full_name')
                    birth_date_str = row.get('birth_date')
                    contact_number = row.get('contact_number', '')
                    voter_status_str = row.get('voter_status', 'False')
                    
                    if not username or not full_name or not birth_date_str:
                        errors.append(f"Row {row_idx}: Missing required files ('username', 'full_name', 'birth_date').")
                        continue

                    try:
                        birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
                    except ValueError:
                        errors.append(f"Row {row_idx}: Invalid date format for '{birth_date_str}'. Expected YYYY-MM-DD.")
                        continue

                    if User.objects.filter(username=username).exists():
                        skipped_count += 1
                        continue

                    voter_status = voter_status_str.strip().lower() in ['true', '1', 'yes']
                    initial_password = birth_date.strftime('%Y%m%d')

                    user = User.objects.create_user(
                        username=username, email=email, password=initial_password, role=User.Role.RESIDENT
                    )

                    Resident.objects.create(
                        user=user, full_name=full_name, birth_date=birth_date,
                        voter_status=voter_status, contact_number=contact_number,
                    )
                    imported_count += 1
        except Exception as e:
            return Response({"detail": f"Database transaction error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response_data = {
            "imported": imported_count,
            "skipped_due_to_duplicate": skipped_count,
            "errors": errors
        }

        if errors:
            return Response(response_data, status=status.HTTP_207_MULTI_STATUS)
        return Response(response_data, status=status.HTTP_200_OK)


class PendingResidentsView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]
    serializer_class = ResidentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.DILG_ADMIN:
            return Resident.objects.filter(is_verified=False)
        return Resident.objects.filter(is_verified=False, user__barangay=user.barangay)


class VerifyResidentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]

    @extend_schema(summary="Verify a resident account", responses={200: ResidentSerializer, 404: OpenApiTypes.OBJECT})
    def patch(self, request, pk):
        resident = get_object_or_404(Resident, pk=pk)
        resident.is_verified = True
        resident.save()

        log_action(
            user=request.user, action_type=AuditLog.ActionType.USER_ACTION,
            description=f"Verified resident account for {resident.full_name} (ID: {resident.id}).", request=request
        )
        return Response(ResidentSerializer(resident).data, status=status.HTTP_200_OK)


class RejectResidentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]

    @extend_schema(summary="Reject and delete a pending resident account", responses={204: None, 404: OpenApiTypes.OBJECT})
    def delete(self, request, pk):
        resident = get_object_or_404(Resident, pk=pk)
        resident_name = resident.full_name
        resident_id = resident.id
        user = resident.user
        user.delete() # Cascades and deletes the Resident profile

        log_action(
            user=request.user, action_type=AuditLog.ActionType.USER_ACTION,
            description=f"Rejected and deleted pending resident account for {resident_name} (ID: {resident_id}).", request=request
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResidentViewSet(viewsets.ModelViewSet):
    """CRUD endpoint for verified residents. Only Barangay Officials can access this full directory."""
    permission_classes = [permissions.IsAuthenticated, IsBarangayOfficial]
    serializer_class = ResidentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.DILG_ADMIN:
            return Resident.objects.filter(is_verified=True).select_related('user').order_by('full_name')
        return Resident.objects.filter(is_verified=True, user__barangay=user.barangay).select_related('user').order_by('full_name')