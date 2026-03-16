from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings

from .serializers import (
    RegisterSerializer, UserSerializer,
    ScoreRecordSerializer, GoogleLoginSerializer
)
from .models import ScoreRecord

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Register a new user with username, email, and password.
    Returns JWT tokens on success.
    """
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "User registered successfully.",
            "user": UserSerializer(user).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class GoogleLoginView(APIView):
    """
    POST /api/auth/google/
    Accepts a Google OAuth2 ID token, verifies it, and returns JWT tokens.
    Creates a new user if one doesn't exist for that Google email.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        id_token_str = serializer.validated_data['token']

        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            idinfo = id_token.verify_oauth2_token(
                id_token_str,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=1000
            )

            email = idinfo.get('email')
            name = idinfo.get('name', '')

            if not email:
                return Response(
                    {"error": "Google token does not contain an email."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': name.split(' ')[0] if name else '',
                    'last_name': ' '.join(name.split(' ')[1:]) if name else '',
                }
            )

            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Login successful.",
                "is_new_user": created,
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {"error": f"Invalid Google token: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ImportError:
            return Response(
                {"error": "Google auth libraries not installed. Install google-auth."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProfileView(generics.RetrieveAPIView):
    """
    GET /api/auth/profile/
    Returns the authenticated user's profile.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ScoreHistoryView(generics.ListAPIView):
    """
    GET /api/auth/scores/
    Returns the authenticated user's score history, newest first.
    """
    serializer_class = ScoreRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ScoreRecord.objects.filter(user=self.request.user).order_by('-completed_at')
