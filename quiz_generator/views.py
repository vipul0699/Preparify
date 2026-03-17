from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .serializers import (
    TopicMaterialSerializer, GenerateQuizRequestSerializer, 
    QuestionSerializer, SubmitAnswerRequestSerializer, EvaluationResponseSerializer
)
from .models import QuizSession, Question, UserResponse, TopicMaterial
from .services.rag_service import rag_service
from .services.llm_service import llm_service
import uuid
import json
import io
from django.utils import timezone
from datetime import timedelta
from django.http import FileResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

class IngestMaterialView(views.APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def post(self, request):
        topic = request.data.get('topic')
        content = request.data.get('content')
        uploaded_file = request.FILES.get('file')

        if not topic:
            return Response({"error": "Topic is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Handle File Upload
        if uploaded_file:
            # 1. Tiered Size Validation
            is_paid = request.user.is_authenticated and request.user.is_paid
            limit_mb = 20 if is_paid else 5
            if uploaded_file.size > limit_mb * 1024 * 1024:
                return Response(
                    {"error": f"File size exceeds the {limit_mb}MB limit for your account."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Text Extraction
            file_name = uploaded_file.name.lower()
            try:
                if file_name.endswith('.pdf'):
                    content = self._extract_pdf_text(uploaded_file)
                elif file_name.endswith('.docx'):
                    content = self._extract_docx_text(uploaded_file)
                elif file_name.endswith('.txt'):
                    content = uploaded_file.read().decode('utf-8')
                else:
                    return Response({"error": "Unsupported file format. Use PDF, DOCX, or TXT."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({"error": f"Failed to extract text: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        if not content:
            return Response({"error": "Material content or file is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Call RAG Service
        rag_service.ingest_material(topic, content)
        
        # Save to DB record
        TopicMaterial.objects.create(topic=topic, content=content)
        
        return Response({"message": "Material ingested successfully"}, status=status.HTTP_201_CREATED)

    def _extract_pdf_text(self, file):
        import PyPDF2
        import io
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text

    def _extract_docx_text(self, file):
        import docx
        import io
        doc = docx.Document(io.BytesIO(file.read()))
        return "\n".join([para.text for para in doc.paragraphs])

class GenerateQuizView(views.APIView):
    def post(self, request):
        serializer = GenerateQuizRequestSerializer(data=request.data)
        if serializer.is_valid():
            topic = serializer.validated_data['topic']
            difficulty = serializer.validated_data['difficulty']
            
            # 0. Daily Limit Check for Free Users
            if request.user.is_authenticated and not request.user.is_paid:
                today = timezone.now().date()
                quizzes_today = QuizSession.objects.filter(
                    user=request.user, 
                    created_at__date=today
                ).count()
                if quizzes_today >= 3:
                    return Response(
                        {"error": "Daily limit reached. Free users can take 3 quizzes per day. Upgrade to Pro for unlimited access!"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # 1. Get Context via RAG
            context = rag_service.get_context(topic)
            
            # 2. Generate Questions via LLM
            generated_data = llm_service.generate_questions(topic, difficulty, context)
            
            # 3. Save to DB — link to authenticated user if available
            quiz_session = QuizSession.objects.create(
                topic=topic,
                user=request.user if request.user.is_authenticated else None
            )
            questions_objects = []
            for q_data in generated_data:
                question = Question.objects.create(
                    quiz_session=quiz_session,
                    text=q_data.get('text', 'No text'),
                    difficulty=q_data.get('difficulty', difficulty),
                    generated_answer=q_data.get('correct_answer', 'Unknown'),
                    explanation=q_data.get('explanation', '')
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
            
            # Auto-create ScoreRecord if user is authenticated and all questions answered
            if request.user.is_authenticated:
                quiz_session = question.quiz_session
                total_questions = quiz_session.questions.count()
                answered_questions = UserResponse.objects.filter(
                    question__quiz_session=quiz_session
                ).count()

                if answered_questions >= total_questions:
                    self._create_score_record(request.user, quiz_session)
            
            resp_serializer = EvaluationResponseSerializer(user_response)
            return Response(resp_serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _create_score_record(self, user, quiz_session):
        """Create a ScoreRecord once all questions in a session are answered."""
        from accounts.models import ScoreRecord

        # Don't create duplicates
        if ScoreRecord.objects.filter(user=user, quiz_session=quiz_session).exists():
            return

        responses = UserResponse.objects.filter(question__quiz_session=quiz_session)
        total_questions = responses.count()
        correct_answers = responses.filter(is_correct=True).count()
        total_score = sum(r.score for r in responses)
        # Score is the sum of individual scores divided by total possible (100 per question)
        score = round(total_score / total_questions) if total_questions > 0 else 0

        ScoreRecord.objects.create(
            user=user,
            quiz_session=quiz_session,
            topic=quiz_session.topic,
            total_questions=total_questions,
            correct_answers=correct_answers,
            score=score,
        )

        # Update Streak
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        if user.last_quiz_at == yesterday:
            user.streak_count += 1
        elif user.last_quiz_at != today:
            user.streak_count = 1
        
        user.last_quiz_at = today
        user.save()

class PersonalizedTopicsView(views.APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"topics": []}, status=status.HTTP_200_OK)

        # Get unique topics from user's last 5 quiz sessions
        recent_topics = QuizSession.objects.filter(user=request.user).order_by('-created_at').values_list('topic', flat=True)[:5]
        recent_topics = list(set(recent_topics)) # De-duplicate

        if not recent_topics:
            return Response({"topics": []}, status=status.HTTP_200_OK)

        personalized_topics = llm_service.generate_personalized_topics(recent_topics)
        
        return Response({"topics": personalized_topics}, status=status.HTTP_200_OK)

class GapAnalysisView(views.APIView):
    def get(self, request, quiz_id):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not request.user.is_paid:
            return Response({"error": "Upgrade to Pro to access Gap Analysis reports."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            quiz_session = QuizSession.objects.get(id=quiz_id, user=request.user)
        except QuizSession.DoesNotExist:
            return Response({"error": "Quiz session not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # If already generated, return it
        if quiz_session.gap_analysis:
            return Response({
                "gap_analysis": quiz_session.gap_analysis,
                "study_focus": quiz_session.study_focus
            }, status=status.HTTP_200_OK)
        
        # Generate Performance Data for LLM
        responses = UserResponse.objects.filter(question__quiz_session=quiz_session)
        performance_data = []
        for r in responses:
            performance_data.append({
                "question": r.question.text,
                "user_answer": r.user_answer,
                "correct_answer": r.question.generated_answer,
                "is_correct": r.is_correct,
                "score": r.score,
                "feedback": r.feedback
            })
        
        # Call LLM
        analysis = llm_service.generate_gap_analysis(quiz_session.topic, performance_data)
        
        # Save to DB
        quiz_session.gap_analysis = analysis.get('gap_analysis')
        quiz_session.study_focus = analysis.get('study_focus')
        quiz_session.save()
        
        return Response(analysis, status=status.HTTP_200_OK)

class DownloadReportView(views.APIView):
    def get(self, request, quiz_id):
        if not request.user.is_authenticated or not request.user.is_paid:
            return Response({"error": "Pro subscription required"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            quiz_session = QuizSession.objects.get(id=quiz_id, user=request.user)
        except QuizSession.DoesNotExist:
            return Response({"error": "Quiz session not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if not quiz_session.gap_analysis:
            return Response({"error": "Report not generated yet. Please view it first."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph(f"Preparify: Quiz Gap Analysis Report", styles['Title']))
        elements.append(Spacer(1, 12))
        
        # Info
        elements.append(Paragraph(f"<b>Topic:</b> {quiz_session.topic}", styles['Normal']))
        elements.append(Paragraph(f"<b>Date:</b> {quiz_session.created_at.strftime('%Y-%m-%d')}", styles['Normal']))
        elements.append(Spacer(1, 24))

        # Gap Analysis Section
        elements.append(Paragraph("Conceptual Breakdown", styles['Heading2']))
        elements.append(Paragraph(quiz_session.gap_analysis, styles['Normal']))
        elements.append(Spacer(1, 24))

        # Study Focus Section
        elements.append(Paragraph("Suggested Study Focus List", styles['Heading2']))
        for item in quiz_session.study_focus:
            elements.append(Paragraph(f"• {item}", styles['Normal']))
        
        elements.append(Spacer(1, 24))
        
        # Performance Summary
        responses = UserResponse.objects.filter(question__quiz_session=quiz_session)
        correct_count = responses.filter(is_correct=True).count()
        total_count = responses.count()
        elements.append(Paragraph(f"<b>Overall Score:</b> {correct_count}/{total_count} correct", styles['Normal']))

        doc.build(elements)
        buffer.seek(0)
        
        return FileResponse(buffer, as_attachment=True, filename=f"Preparify_Report_{quiz_id[:8]}.pdf")
