import logging
import json
import uuid
import io
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from .models import Exam, ExamSection, ExamQuestionGroup, ExamQuestion, ExamAttempt, ExamResponse
from quiz_generator.services.llm_service import llm_service

logger = logging.getLogger(__name__)

class IngestExamView(views.APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        exam_type = request.data.get('exam_type', 'CAT')
        text_content = request.data.get('content')
        file_obj = request.FILES.get('file')

        logger.info(f"Starting exam ingestion: type={exam_type}, file={file_obj.name if file_obj else 'None'}")

        try:
            if file_obj:
                logger.info(f"Extracting text from uploaded file: {file_obj.name}")
                if file_obj.name.endswith('.pdf'):
                    import PyPDF2
                    pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_obj.read()))
                    text_content = ""
                    for page in pdf_reader.pages:
                        text_content += page.extract_text() + "\n"
                else:
                    text_content = file_obj.read().decode('utf-8')

            if not text_content:
                logger.error("Ingestion failed: No content provided")
                return Response({"error": "No content provided"}, status=status.HTTP_400_BAD_REQUEST)

            logger.info("Calling LLM to parse exam paper...")
            parsed_data = llm_service.parse_exam_paper(text_content, exam_type)
            
            if not parsed_data:
                logger.error("LLM failed to parse the exam paper")
                return Response({"error": "Failed to parse exam"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            logger.info(f"LLM successfully parsed exam: {parsed_data.get('name', 'Unknown')}. Saving to database...")
            exam = self._save_parsed_exam(parsed_data)
            
            logger.info(f"Exam ingestion complete: ID={exam.id}")
            return Response({"message": "Exam ingested successfully", "exam_id": exam.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.exception(f"Unexpected error during exam ingestion: {str(e)}")
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _save_parsed_exam(self, data, is_pro=False):
        try:
            exam = Exam.objects.create(
                name=data.get('name', 'Unnamed Exam'),
                exam_type=data.get('exam_type', 'CAT'),
                duration_minutes=data.get('duration_minutes', 120),
                is_official=not is_pro,
                is_pro=is_pro
            )
            for idx, s_data in enumerate(data.get('sections', [])):
                section = ExamSection.objects.create(
                    exam=exam,
                    name=s_data.get('name'),
                    order=idx,
                    duration_minutes=s_data.get('duration_minutes', 40)
                )
                for g_data in s_data.get('groups', []):
                    group = ExamQuestionGroup.objects.create(
                        section=section,
                        title=g_data.get('title'),
                        context_text=g_data.get('context_text')
                    )
                    for q_data in g_data.get('questions', []):
                        ExamQuestion.objects.create(
                            section=section,
                            group=group,
                            text=q_data.get('text'),
                            question_type=q_data.get('type', 'MCQ'),
                            options=q_data.get('options'),
                            correct_answer=q_data.get('correct_answer'),
                            marks=q_data.get('marks', 3),
                            penalty=q_data.get('penalty', 1)
                        )
                for q_data in s_data.get('standalone_questions', []):
                    ExamQuestion.objects.create(
                        section=section,
                        text=q_data.get('text'),
                        question_type=q_data.get('type', 'MCQ'),
                        options=q_data.get('options'),
                        correct_answer=q_data.get('correct_answer'),
                        marks=q_data.get('marks', 3),
                        penalty=q_data.get('penalty', 1)
                    )
            return exam
        except Exception as e:
            logger.error(f"Error saving parsed exam to DB: {str(e)}")
            raise

class GenerateMockExamView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"User {request.user.username} requested AI Mock Exam generation")
        
        if not request.user.is_paid:
            logger.warning(f"User {request.user.username} denied: Not a Pro user")
            return Response({"error": "Pro subscription required for Certified Mock Exams."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            exam_type = request.data.get('exam_type', 'CAT')
            logger.info(f"Generating {exam_type} mock exam via LLM...")
            
            parsed_data = llm_service.generate_mock_exam(exam_type)
            if not parsed_data:
                logger.error("LLM failed to generate a mock exam")
                return Response({"error": "Failed to generate mock"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            logger.info("AI Mock generated successfully. Saving to database...")
            ingest_view = IngestExamView()
            exam = ingest_view._save_parsed_exam(parsed_data, is_pro=True)
            
            logger.info(f"AI Mock creation complete: ID={exam.id}")
            return Response({"message": "Certified Mock Exam generated", "exam_id": exam.id}, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.exception(f"Unexpected error during mock generation: {str(e)}")
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ExamListView(views.APIView):
    def get(self, request):
        try:
            exams = Exam.objects.all().order_by('-created_at')
            data = []
            for e in exams:
                data.append({
                    "id": e.id,
                    "name": e.name,
                    "exam_type": e.exam_type,
                    "is_pro": e.is_pro,
                    "is_official": e.is_official,
                    "duration": e.duration_minutes
                })
            return Response(data)
        except Exception as e:
            logger.error(f"Error fetching exam list: {str(e)}")
            return Response({"error": "Failed to fetch exams"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StartExamAttemptView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, exam_id):
        logger.info(f"User {request.user.username} starting attempt for exam ID: {exam_id}")
        
        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            logger.error(f"Exam ID {exam_id} not found")
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if exam.is_pro and not request.user.is_paid:
            logger.warning(f"User {request.user.username} blocked from Pro exam")
            return Response({"error": "Pro subscription required for this exam."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            attempt = ExamAttempt.objects.create(user=request.user, exam=exam)
            logger.info(f"Attempt created: ID={attempt.id}")
            
            sections_data = []
            for section in exam.sections.all():
                questions_data = []
                for q in section.questions.filter(group__isnull=True):
                    questions_data.append({
                        "id": q.id, "text": q.text, "type": q.question_type,
                        "options": q.options, "marks": q.marks, "penalty": q.penalty
                    })
                
                groups_data = []
                for group in section.question_groups.all():
                    group_qs = []
                    for q in group.questions.all():
                        group_qs.append({
                            "id": q.id, "text": q.text, "type": q.question_type,
                            "options": q.options, "marks": q.marks, "penalty": q.penalty
                        })
                    groups_data.append({
                        "id": group.id, "title": group.title, "context_text": group.context_text,
                        "questions": group_qs
                    })

                sections_data.append({
                    "id": section.id, "name": section.name, "duration": section.duration_minutes,
                    "questions": questions_data, "groups": groups_data
                })

            return Response({
                "attempt_id": attempt.id, "exam_name": exam.name,
                "duration": exam.duration_minutes, "sections": sections_data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.exception(f"Error initializing exam attempt: {str(e)}")
            return Response({"error": "Failed to initialize exam"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubmitExamAttemptView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        logger.info(f"User {request.user.username} submitting attempt ID: {attempt_id}")
        
        try:
            attempt = ExamAttempt.objects.get(id=attempt_id, user=request.user)
        except ExamAttempt.DoesNotExist:
            logger.error(f"Attempt {attempt_id} not found for user {request.user.username}")
            return Response({"error": "Attempt not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if attempt.status == 'FINISHED':
            logger.warning(f"Attempt {attempt_id} already submitted")
            return Response({"error": "Attempt already submitted"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            responses_data = request.data.get('responses', [])
            total_score = 0
            
            logger.info(f"Processing {len(responses_data)} responses...")
            for resp in responses_data:
                q_id = resp.get('question_id')
                ans = resp.get('answer')
                time_spent = resp.get('time_taken', 0)
                
                try:
                    question = ExamQuestion.objects.get(id=q_id)
                except ExamQuestion.DoesNotExist:
                    logger.error(f"Question ID {q_id} not found during submission")
                    continue
                
                is_correct = str(ans).strip().lower() == str(question.correct_answer).strip().lower()
                score = question.marks if is_correct else (-question.penalty if question.question_type == 'MCQ' else 0)
                
                ExamResponse.objects.create(
                    attempt=attempt, question=question, user_answer=ans,
                    is_correct=is_correct, score_earned=score, time_taken_seconds=time_spent
                )
                total_score += score
                
            attempt.total_score = total_score
            attempt.status = 'FINISHED'
            attempt.end_time = timezone.now()
            
            if request.user.is_paid:
                logger.info("Pro user detected. Calculating predicted percentile...")
                max_marks = sum([q.marks for q in ExamQuestion.objects.filter(section__exam=attempt.exam)])
                prediction = llm_service.calculate_percentile(attempt.exam.name, total_score, max_marks)
                attempt.predicted_percentile = prediction.get('percentile', 0)
                logger.info(f"Predicted percentile: {attempt.predicted_percentile}")
            
            attempt.save()
            logger.info(f"Submission successful. Final Score: {total_score}")
            
            return Response({
                "message": "Exam submitted successfully",
                "score": total_score,
                "percentile": attempt.predicted_percentile
            })
            
        except Exception as e:
            logger.exception(f"Unexpected error during exam submission: {str(e)}")
            return Response({"error": f"An unexpected error occurred during submission: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
