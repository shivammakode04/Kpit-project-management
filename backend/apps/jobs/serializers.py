from rest_framework import serializers
from apps.jobs.models import BackgroundJob


class BackgroundJobSerializer(serializers.ModelSerializer):
    """Serializer for background jobs."""

    class Meta:
        model = BackgroundJob
        fields = [
            'id', 'job_type', 'status', 'payload', 'result',
            'retry_count', 'max_retries', 'error_message',
            'scheduled_at', 'executed_at', 'created_at',
        ]
        read_only_fields = fields


class TriggerJobSerializer(serializers.Serializer):
    """Serializer for manually triggering a job."""
    job_type = serializers.ChoiceField(
        choices=['deadline_reminder', 'notification_cleanup'],
    )
