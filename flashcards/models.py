import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class Flashcard(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='flashcards'
    )
    # Storing question/answer text directly for persistence even if original question is deleted
    question_text = models.TextField()
    answer_text = models.TextField()
    explanation = models.TextField(null=True, blank=True)
    
    # SM-2 Algorithm fields
    interval = models.IntegerField(default=0, help_text="Days until next review")
    easiness = models.FloatField(default=2.5, help_text="SM-2 Ease Factor")
    repetitions = models.IntegerField(default=0, help_text="Consecutive correct reviews")
    next_review = models.DateField(default=timezone.now)
    
    created_at = models.DateTimeField(auto_now_add=True)
    source_question = models.ForeignKey(
        'quiz_generator.Question', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    def __str__(self):
        return f"Flashcard for {self.user.email} - {self.question_text[:30]}"

    class Meta:
        ordering = ['next_review']
