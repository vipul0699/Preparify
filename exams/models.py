import uuid
from django.db import models
from django.conf import settings

class Exam(models.Model):
    EXAM_TYPES = [
        ('CAT', 'Common Admission Test'),
        ('UPSC', 'Union Public Service Commission'),
        ('JEE', 'Joint Entrance Examination'),
        # Add more as we expand
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="e.g. CAT 2023 Slot 1")
    exam_type = models.CharField(max_length=50, choices=EXAM_TYPES, default='CAT')
    year = models.IntegerField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=120)
    is_official = models.BooleanField(default=True, help_text="True if it's a past year paper")
    is_pro = models.BooleanField(default=False, help_text="True if it's an AI-generated Certified Mock")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ExamSection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.ForeignKey(Exam, related_name='sections', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, help_text="e.g. VARC, DILR, QA")
    order = models.IntegerField(default=0)
    duration_minutes = models.IntegerField(default=40)
    
    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.exam.name} - {self.name}"

class ExamQuestionGroup(models.Model):
    """Used for Reading Comprehension passages or Data Interpretation sets."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    section = models.ForeignKey(ExamSection, related_name='question_groups', on_delete=models.CASCADE)
    context_text = models.TextField(help_text="The passage or data description")
    title = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"Group in {self.section.name}: {self.title or self.id}"

class ExamQuestion(models.Model):
    QUESTION_TYPES = [
        ('MCQ', 'Multiple Choice Question'),
        ('TITA', 'Type In The Answer'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    section = models.ForeignKey(ExamSection, related_name='questions', on_delete=models.CASCADE)
    group = models.ForeignKey(ExamQuestionGroup, related_name='questions', on_delete=models.CASCADE, null=True, blank=True)
    text = models.TextField()
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES, default='MCQ')
    options = models.JSONField(null=True, blank=True, help_text="List of strings for MCQ")
    correct_answer = models.TextField()
    marks = models.IntegerField(default=3)
    penalty = models.IntegerField(default=1, help_text="Negative marks for wrong answer")
    explanation = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.section.name} Q: {self.text[:50]}..."

class ExamAttempt(models.Model):
    STATUS_CHOICES = [
        ('STARTED', 'Started'),
        ('FINISHED', 'Finished'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='exam_attempts', on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='STARTED')
    total_score = models.FloatField(default=0.0)
    predicted_percentile = models.FloatField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.exam.name}"

class ExamResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(ExamAttempt, related_name='responses', on_delete=models.CASCADE)
    question = models.ForeignKey(ExamQuestion, on_delete=models.CASCADE)
    user_answer = models.TextField(null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    score_earned = models.FloatField(default=0.0)
    time_taken_seconds = models.IntegerField(default=0)

    def __str__(self):
        return f"Response to {self.question.id} in {self.attempt.id}"
