from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Flashcard
from .serializers import FlashcardSerializer, FlashcardReviewSerializer
from .services import update_sm2, create_flashcard_from_question

class FlashcardListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        List all flashcards for the user.
        Query param 'due=true' to list only due cards.
        """
        due_only = request.query_params.get('due', 'false').lower() == 'true'
        queryset = Flashcard.objects.filter(user=request.user)
        
        if due_only:
            queryset = queryset.filter(next_review__lte=timezone.now().date())
        
        serializer = FlashcardSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Manual creation (e.g., from UI button)"""
        question_text = request.data.get('question_text')
        answer_text = request.data.get('answer_text')
        explanation = request.data.get('explanation')

        if not question_text or not answer_text:
            return Response({"error": "Question and answer are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check monetization limit
        if not request.user.is_paid:
            count = Flashcard.objects.filter(user=request.user).count()
            if count >= 10:
                return Response({"error": "Free users can only save up to 10 cards."}, status=status.HTTP_403_FORBIDDEN)

        card = Flashcard.objects.create(
            user=request.user,
            question_text=question_text,
            answer_text=answer_text,
            explanation=explanation
        )
        return Response(FlashcardSerializer(card).data, status=status.HTTP_201_CREATED)

class FlashcardReviewView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        """Update SM-2 stats after review"""
        try:
            card = Flashcard.objects.get(id=pk, user=request.user)
        except Flashcard.DoesNotExist:
            return Response({"error": "Flashcard not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = FlashcardReviewSerializer(data=request.data)
        if serializer.is_valid():
            quality = serializer.validated_data['quality']
            
            easiness, interval, repetitions = update_sm2(
                card.easiness, card.interval, card.repetitions, quality
            )
            
            card.easiness = easiness
            card.interval = interval
            card.repetitions = repetitions
            card.next_review = timezone.now().date() + timedelta(days=interval)
            card.save()

            return Response({
                "message": "Flashcard updated successfully.",
                "next_review": card.next_review,
                "interval": card.interval
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FlashcardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get counts and a sample topic for dashboard notification"""
        due_cards = Flashcard.objects.filter(
            user=request.user, 
            next_review__lte=timezone.now().date()
        )
        due_count = due_cards.count()
        total_count = Flashcard.objects.filter(user=request.user).count()
        
        sample_topic = None
        if due_count > 0:
            # Try to find a topic from source question or just use snippet of question
            first_card = due_cards.first()
            if first_card.source_question and first_card.source_question.quiz_session:
                sample_topic = first_card.source_question.quiz_session.topic
            else:
                sample_topic = first_card.question_text[:30] + "..."

        return Response({
            "due_count": due_count,
            "total_count": total_count,
            "sample_topic": sample_topic,
            "is_paid": request.user.is_paid
        })
