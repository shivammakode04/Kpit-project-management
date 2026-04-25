from rest_framework import serializers
from django.core.files.uploadedfile import InMemoryUploadedFile
from apps.tasks.models import Task, TaskAttachment, Comment, ActivityLog
from apps.core.utils import validate_file_upload
from apps.users.serializers import UserSerializer


class TaskSerializer(serializers.ModelSerializer):
    """Task serializer with related info."""
    assigned_to_names = serializers.SerializerMethodField()
    assigned_to_details = serializers.SerializerMethodField()
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
            'assigned_to', 'assigned_to_names', 'assigned_to_details',
            'completed_by', 'due_date', 'created_by', 'created_by_name',
            'estimated_hours', 'actual_hours', 'task_type',
            'labels', 'is_blocked',
            'comment_count', 'attachment_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'story', 'created_by', 'created_at', 'updated_at']

    def get_assigned_to_names(self, obj):
        return [user.username for user in obj.assigned_to.all()]

    def get_assigned_to_details(self, obj):
        return [
            {
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'avatar_url': user.avatar_url.url if user.avatar_url else None
            }
            for user in obj.assigned_to.all()
        ]

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_attachment_count(self, obj):
        return obj.attachments.count()


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a task."""
    assigned_to = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True,
        required=False
    )

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status',
            'priority', 'assigned_to', 'due_date',
            'estimated_hours', 'actual_hours', 'task_type',
            'labels',
        ]


class TaskStatusSerializer(serializers.Serializer):
    """Serializer for updating task status."""
    status = serializers.ChoiceField(choices=Task.Status.choices)


class TaskAssignSerializer(serializers.Serializer):
    """Serializer for assigning a task."""
    assigned_to = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True
    )


class CommentSerializer(serializers.ModelSerializer):
    """Comment serializer."""
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'task', 'user', 'user_name', 'user_avatar',
            'content', 'created_at',
        ]
        read_only_fields = ['id', 'task', 'user', 'created_at']

    def get_user_avatar(self, obj):
        if obj.user.avatar_url:
            return obj.user.avatar_url.url
        return None


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a comment."""

    class Meta:
        model = Comment
        fields = ['content']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """Task attachment serializer."""
    uploaded_by_detail = UserSerializer(source='uploaded_by', read_only=True)

    class Meta:
        model = TaskAttachment
        fields = [
            'id', 'task', 'file', 'filename', 'file_size', 'content_type',
            'uploaded_by', 'uploaded_by_detail', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_file(self, value):
        """Validate uploaded file."""
        try:
            validate_file_upload(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        return value


class TaskAttachmentUploadSerializer(serializers.Serializer):
    """Serializer for uploading a task attachment."""
    file = serializers.FileField()

    def validate_file(self, value):
        """Validate uploaded file."""
        try:
            validate_file_upload(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        return value


class TaskSerializerWithAttachments(serializers.ModelSerializer):
    """Task serializer with attachment support."""
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'story', 'title', 'description', 'status', 'priority',
            'assigned_to', 'due_date', 'estimated_hours', 'actual_hours',
            'task_type', 'labels', 'is_blocked', 'created_by', 'attachments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


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
