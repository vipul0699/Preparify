from django.urls import path
from .views import IngestMaterialView, GenerateQuizView, SubmitAnswerView

urlpatterns = [
    path('ingest/', IngestMaterialView.as_view(), name='ingest'),
    path('generate/', GenerateQuizView.as_view(), name='generate'),
    path('submit/', SubmitAnswerView.as_view(), name='submit'),
]
