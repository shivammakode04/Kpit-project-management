from django.contrib import admin
from .models import Task, TaskAttachment, Comment, ActivityLog


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    autocomplete_fields = ['user']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'story', 'status', 'priority', 'get_assignees', 'due_date', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description', 'story__title']
    filter_horizontal = ['assigned_to']
    autocomplete_fields = ['story', 'created_by']
    inlines = [CommentInline]
    
    def get_assignees(self, obj):
        return ', '.join([u.username for u in obj.assigned_to.all()[:3]])
    get_assignees.short_description = 'Assigned To'


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'task', 'uploaded_by', 'file_size', 'created_at']
    search_fields = ['filename', 'task__title']
    autocomplete_fields = ['task', 'uploaded_by']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'content_preview', 'created_at']
    search_fields = ['content', 'task__title', 'user__username']
    autocomplete_fields = ['task', 'user']
    
    def content_preview(self, obj):
        return obj.content[:50]
    content_preview.short_description = 'Content'


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'action', 'target_type', 'created_at']
    list_filter = ['target_type', 'created_at']
    search_fields = ['action', 'user__username', 'project__name']
    autocomplete_fields = ['user', 'project']
