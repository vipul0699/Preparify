from django.contrib import admin
from .models import Exam, ExamSection, ExamQuestionGroup, ExamQuestion, ExamAttempt, ExamResponse

class ExamSectionInline(admin.TabularInline):
    model = ExamSection
    extra = 1

class ExamQuestionInline(admin.TabularInline):
    model = ExamQuestion
    extra = 1

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('name', 'exam_type', 'year', 'is_official', 'is_pro')
    list_filter = ('exam_type', 'is_official', 'is_pro')
    inlines = [ExamSectionInline]

@admin.register(ExamSection)
class ExamSectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'exam', 'duration_minutes', 'order')
    list_filter = ('exam',)

@admin.register(ExamQuestionGroup)
class ExamQuestionGroupAdmin(admin.ModelAdmin):
    list_display = ('title', 'section')

@admin.register(ExamQuestion)
class ExamQuestionAdmin(admin.ModelAdmin):
    list_display = ('text_preview', 'section', 'question_type', 'marks')
    list_filter = ('section__exam', 'question_type')
    
    def text_preview(self, obj):
        return obj.text[:50]

@admin.register(ExamAttempt)
class ExamAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'exam', 'status', 'total_score', 'predicted_percentile', 'start_time')
    list_filter = ('status', 'exam')
