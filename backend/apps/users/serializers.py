from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import models

from apps.core.utils import validate_file_upload, ALLOWED_IMAGE_TYPES

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password',
            'password_confirm', 'full_name',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError(
                {'password_confirm': 'Passwords do not match.'}
            )
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Public user serializer (read-only)."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name',
            'avatar_url', 'role', 'is_active', 'created_at',
        ]
        read_only_fields = fields


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user serializer with workload stats."""
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()
    project_count = serializers.SerializerMethodField()
    overdue_task_count = serializers.SerializerMethodField()
    in_progress_count = serializers.SerializerMethodField()
    recent_activity = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name',
            'avatar_url', 'role', 'is_active', 'created_at',
            'task_count', 'completed_task_count', 'project_count',
            'overdue_task_count', 'in_progress_count', 'recent_activity',
        ]
        read_only_fields = fields

    def get_task_count(self, obj):
        return obj.assigned_tasks.count()

    def get_completed_task_count(self, obj):
        return obj.assigned_tasks.filter(status='done').count()

    def get_project_count(self, obj):
        return obj.project_memberships.filter(status='accepted').count()

    def get_overdue_task_count(self, obj):
        from django.utils import timezone
        return obj.assigned_tasks.filter(
            due_date__lt=timezone.now().date(),
            status__in=['todo', 'in_progress', 'blocked'],
        ).count()

    def get_in_progress_count(self, obj):
        return obj.assigned_tasks.filter(status='in_progress').count()

    def get_recent_activity(self, obj):
        from apps.tasks.models import ActivityLog
        logs = ActivityLog.objects.filter(user=obj).order_by('-created_at')[:5]
        return [{
            'id': log.id,
            'action': log.action,
            'project_id': log.project_id,
            'created_at': log.created_at.isoformat(),
        } for log in logs]


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for profile viewing and editing."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name',
            'avatar_url', 'role', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'username', 'role', 'is_active', 'created_at']


class AvatarUploadSerializer(serializers.Serializer):
    """Serializer for avatar file upload."""
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        try:
            validate_file_upload(value, allowed_types=ALLOWED_IMAGE_TYPES)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    new_password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {'new_password_confirm': 'Passwords do not match.'}
            )
        return attrs
