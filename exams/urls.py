from django.urls import path
from .views import (
    ExamListView, StartExamAttemptView, IngestExamView, GenerateMockExamView, SubmitExamAttemptView
)

urlpatterns = [
    path('', ExamListView.as_view(), name='exam-list'),
    path('ingest/', IngestExamView.as_view(), name='exam-ingest'),
    path('generate-mock/', GenerateMockExamView.as_view(), name='exam-generate-mock'),
    path('<uuid:exam_id>/start/', StartExamAttemptView.as_view(), name='exam-start'),
    path('attempts/<uuid:attempt_id>/submit/', SubmitExamAttemptView.as_view(), name='exam-submit'),
]
