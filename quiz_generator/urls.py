from django.urls import path
from .views import IngestMaterialView, GenerateQuizView, SubmitAnswerView, PersonalizedTopicsView, GapAnalysisView, DownloadReportView

urlpatterns = [
    path('ingest/', IngestMaterialView.as_view(), name='ingest'),
    path('generate/', GenerateQuizView.as_view(), name='generate'),
    path('submit/', SubmitAnswerView.as_view(), name='submit'),
    path('personalized-topics/', PersonalizedTopicsView.as_view(), name='personalized-topics'),
    path('sessions/<uuid:quiz_id>/gap-analysis/', GapAnalysisView.as_view(), name='gap-analysis'),
    path('sessions/<uuid:quiz_id>/download-report/', DownloadReportView.as_view(), name='download-report'),
]
