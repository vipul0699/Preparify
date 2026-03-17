from django.utils import timezone
from datetime import timedelta
from .models import Flashcard

def update_sm2(easiness, interval, repetitions, quality):
    """
    quality: 0-5 (0: complete blackout, 5: perfect response)
    Returns: (new_easiness, new_interval, new_repetitions)
    """
    if quality >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * easiness)
        repetitions += 1
    else:
        repetitions = 0
        interval = 1
    
    easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if easiness < 1.3:
        easiness = 1.3
        
    return easiness, interval, repetitions

def create_flashcard_from_question(user, question, user_response=None):
    """
    Creates a flashcard for a user from a question they missed.
    Handles monetization limits: 10 for Free users, unlimited for Pro.
    """
    # Check monetization limits
    if not user.is_paid:
        flashcard_count = Flashcard.objects.filter(user=user).count()
        if flashcard_count >= 10:
            return None, "Free users can only save up to 10 flashcards. Upgrade to Pro for unlimited!"

    # Create the flashcard
    flashcard = Flashcard.objects.create(
        user=user,
        question_text=question.text,
        answer_text=question.generated_answer,
        explanation=question.explanation,
        source_question=question
    )
    return flashcard, "Flashcard created successfully."
