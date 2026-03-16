import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """Custom user model with email as a required unique field."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    is_paid = models.BooleanField(default=False, help_text="True if user has a paid subscription")
    streak_count = models.IntegerField(default=0)
    last_quiz_at = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.email


class ScoreRecord(models.Model):
    """Stores a user's score for a completed quiz session."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, related_name='scores', on_delete=models.CASCADE)
    quiz_session = models.ForeignKey(
        'quiz_generator.QuizSession', on_delete=models.CASCADE, related_name='score_records'
    )
    topic = models.CharField(max_length=255)
    total_questions = models.IntegerField()
    correct_answers = models.IntegerField()
    score = models.IntegerField(help_text="User's total score for this quiz (0-100)")
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} — {self.topic}: {self.score}/100"
