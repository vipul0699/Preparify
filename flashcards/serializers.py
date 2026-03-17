from rest_framework import serializers
from .models import Flashcard

class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ['id', 'question_text', 'answer_text', 'explanation', 'next_review', 'interval', 'repetitions']
        read_only_fields = ['id', 'next_review', 'interval', 'repetitions']

class FlashcardReviewSerializer(serializers.Serializer):
    quality = serializers.IntegerField(min_value=0, max_value=5, help_text="Review quality 0-5 (0: bad, 5: perfect)")
