from rest_framework import serializers
from .models import TopicMaterial, QuizSession, Question, UserResponse

class TopicMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicMaterial
        fields = ['topic', 'content']

class GenerateQuizRequestSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=255)
    difficulty = serializers.ChoiceField(choices=['Easy', 'Medium', 'Hard'], default='Medium')

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'difficulty']

class SubmitAnswerRequestSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    user_answer = serializers.CharField()

class EvaluationResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserResponse
        fields = ['question', 'user_answer', 'score', 'feedback', 'is_correct']
