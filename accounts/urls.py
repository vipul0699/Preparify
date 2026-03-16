from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, GoogleLoginView, ProfileView, ScoreHistoryView

urlpatterns = [
    # Email + password
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', TokenObtainPairView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # Google OAuth
    path('google/', GoogleLoginView.as_view(), name='auth-google'),

    # User info
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('scores/', ScoreHistoryView.as_view(), name='auth-scores'),
]
