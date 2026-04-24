from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'message_preview', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['message', 'user__username']
    autocomplete_fields = ['user']
    
    def message_preview(self, obj):
        return obj.message[:50]
    message_preview.short_description = 'Message'
