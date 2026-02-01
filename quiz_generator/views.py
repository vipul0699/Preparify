from rest_framework import views, status
from rest_framework.response import Response
from .serializers import (
    TopicMaterialSerializer, GenerateQuizRequestSerializer, 
    QuestionSerializer, SubmitAnswerRequestSerializer, EvaluationResponseSerializer
)
from .models import QuizSession, Question, UserResponse
from .services.rag_service import rag_service
from .services.llm_service import llm_service
import uuid

class IngestMaterialView(views.APIView):
    def post(self, request):
        serializer = TopicMaterialSerializer(data=request.data)
        if serializer.is_valid():
            topic = serializer.validated_data['topic']
            content = serializer.validated_data['content']
            
            # Call Service
            rag_service.ingest_material(topic, content)
            
            # Save to DB for record
            serializer.save()
            return Response({"message": "Material ingested successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GenerateQuizView(views.APIView):
    def post(self, request):
        serializer = GenerateQuizRequestSerializer(data=request.data)
        if serializer.is_valid():
            topic = serializer.validated_data['topic']
            difficulty = serializer.validated_data['difficulty']
            
            # 1. Get Context via RAG
            context = rag_service.get_context(topic)
            
            # 2. Generate Questions via LLM
            generated_data = llm_service.generate_questions(topic, difficulty, context)
            
            # 3. Save to DB
            quiz_session = QuizSession.objects.create(topic=topic)
            questions_objects = []
            for q_data in generated_data:
                question = Question.objects.create(
                    quiz_session=quiz_session,
                    text=q_data.get('text', 'No text'),
                    difficulty=q_data.get('difficulty', difficulty),
                    generated_answer=q_data.get('correct_answer', 'Unknown')
                )
                questions_objects.append(question)
            
            response_serializer = QuestionSerializer(questions_objects, many=True)
            return Response({
                "quiz_id": quiz_session.id,
                "questions": response_serializer.data,
                "context_used": bool(context)
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SubmitAnswerView(views.APIView):
    def post(self, request):
        serializer = SubmitAnswerRequestSerializer(data=request.data)
        if serializer.is_valid():
            question_id = serializer.validated_data['question_id']
            user_answer = serializer.validated_data['user_answer']
            
            try:
                question = Question.objects.get(id=question_id)
            except Question.DoesNotExist:
                return Response({"error": "Question not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Evaluate via LLM
            evaluation = llm_service.evaluate_answer(
                question.text, 
                question.generated_answer, 
                user_answer
            )
            
            # Save Response
            user_response = UserResponse.objects.create(
                question=question,
                user_answer=user_answer,
                score=evaluation.get('score', 0),
                feedback=evaluation.get('feedback', 'No feedback'),
                is_correct=evaluation.get('is_correct', False)
            )
            
            resp_serializer = EvaluationResponseSerializer(user_response)
            return Response(resp_serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
