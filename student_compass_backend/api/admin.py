from django.contrib import admin
from .models import *
# Register your models here.
admin.site.register(User)
admin.site.register(Mood)
admin.site.register(Conversation)
admin.site.register(Message)
admin.site.register(Habit)
admin.site.register(JournalEntry)
admin.site.register(HabitCompletion)
