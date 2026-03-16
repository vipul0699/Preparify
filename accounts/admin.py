from django.contrib import admin
from .models import CustomUser, ScoreRecord

admin.site.register(CustomUser)
admin.site.register(ScoreRecord)
