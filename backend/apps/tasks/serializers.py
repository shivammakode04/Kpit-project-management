from rest_framework import serializers
from apps.tasks.models import Task, TaskAttachment, Comment, ActivityLog
from apps.core.utils import validate_file_upload


class TaskSerializer(serializers.ModelSerializer):
    """Task serializer with related info."""
    assigned_to_name = serializers.CharField(
        source='assigned_to.username', read_only=True, default=None,
    )
    created_by_name = serializers.CharField(
        source='created_by.username', read_only=True,
    )
    story_title = serializers.CharField(
        source='story.title', read_only=True,
    )
    project_id = serializers.IntegerField(
        source='story.project_id', read_only=True,
    )
    comment_count = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'story', 'story_title', 'project_id',
            'title', 'description', 'status', 'priority',
            'assigned_to', 'assigned_to_name',
            'due_date', 'created_by', 'created_by_name',
            'comment_count', 'attachment_count', 'created_at',
        ]
        read_only_fields = ['id', 'story', 'created_by', 'created_at']

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_attachment_count(self, obj):
        return obj.attachments.count()


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a task."""

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status',
            'priority', 'assigned_to', 'due_date',
        ]


class TaskStatusSerializer(serializers.Serializer):
    """Serializer for updating task status."""
    status = serializers.ChoiceField(choices=Task.Status.choices)


class TaskAssignSerializer(serializers.Serializer):
    """Serializer for assigning a task."""
    assigned_to = serializers.IntegerField(allow_null=True)


class CommentSerializer(serializers.ModelSerializer):
    """Comment serializer."""
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar_url', read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id', 'task', 'user', 'user_name', 'user_avatar',
            'content', 'created_at',
        ]
        read_only_fields = ['id', 'task', 'user', 'created_at']


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a comment."""

    class Meta:
        model = Comment
        fields = ['content']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """Task attachment serializer."""
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.username', read_only=True,
    )

    class Meta:
        model = TaskAttachment
        fields = [
            'id', 'task', 'file', 'filename', 'file_size',
            'uploaded_by', 'uploaded_by_name', 'uploaded_at',
        ]
        read_only_fields = fields


class TaskAttachmentUploadSerializer(serializers.Serializer):
    """Serializer for uploading a task attachment."""
    file = serializers.FileField()

    def validate_file(self, value):
        try:
            validate_file_upload(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        return value


class ActivityLogSerializer(serializers.ModelSerializer):
    """Activity log serializer."""
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_name', 'project',
            'action', 'target_type', 'target_id', 'created_at',
        ]
        read_only_fields = fields
