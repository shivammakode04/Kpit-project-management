from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Notification serializer."""
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)
    title = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'title', 'message', 'is_read', 'project', 'project_name', 'related_object_id', 'created_at']
        read_only_fields = fields

    def get_title(self, obj):
        return obj.type.replace('_', ' ').title()
