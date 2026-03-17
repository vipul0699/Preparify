from django.urls import path
from .views import FlashcardListView, FlashcardReviewView, FlashcardStatsView

urlpatterns = [
    path('', FlashcardListView.as_view(), name='flashcard-list'),
    path('stats/', FlashcardStatsView.as_view(), name='flashcard-stats'),
    path('<uuid:pk>/review/', FlashcardReviewView.as_view(), name='flashcard-review'),
]
