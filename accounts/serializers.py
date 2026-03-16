from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ScoreRecord

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration with email and password."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile info."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined', 'is_paid', 'streak_count']
        read_only_fields = fields


class ScoreRecordSerializer(serializers.ModelSerializer):
    """Serializer for score history."""
    class Meta:
        model = ScoreRecord
        fields = ['id', 'quiz_session', 'topic', 'total_questions', 'correct_answers', 'score', 'completed_at']
        read_only_fields = fields


class GoogleLoginSerializer(serializers.Serializer):
    """Accepts a Google OAuth ID token for login/registration."""
    token = serializers.CharField(help_text="Google OAuth2 ID token")
