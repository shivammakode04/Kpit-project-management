from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Notification serializer."""

    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'message', 'is_read', 'created_at']
        read_only_fields = fields
