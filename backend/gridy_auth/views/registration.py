from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from gridy_auth.serializers import (
    UserSerializer,
    RegisterSerializer,
    AdminRegisterSerializer
)
from gridy_auth.tasks import send_welcome_email

@extend_schema(tags=['Authentication'])
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=RegisterSerializer, responses={201: UserSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Send welcome email asynchronously
            full_name = getattr(user, 'profile', user).full_name if hasattr(user, 'profile') else user.username 
            send_welcome_email.delay(user.email, full_name)

            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@extend_schema(tags=['Authentication'])
class AdminRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=AdminRegisterSerializer, responses={201: UserSerializer})
    def post(self, request):
        serializer = AdminRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            full_name = f"{user.first_name} {user.last_name}".strip() or user.username
            try:
                send_welcome_email.delay(user.email, full_name)
            except Exception:
                pass

            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)