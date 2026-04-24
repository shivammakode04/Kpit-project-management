from django.contrib import admin
from .models import UserStory


@admin.register(UserStory)
class UserStoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'priority', 'created_by', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description', 'project__name']
    autocomplete_fields = ['project', 'created_by']
