from rest_framework import serializers
from django.contrib.auth import get_user_model

from apps.projects.models import Project, ProjectMember
from apps.users.serializers import UserSerializer
from apps.core.validators import validate_project_name, validate_hours
from apps.core.security import sanitize_html

User = get_user_model()


class ProjectSerializer(serializers.ModelSerializer):
    """Project serializer with enhanced project info."""
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    member_count = serializers.SerializerMethodField()
    story_count = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'owner', 'owner_name',
            'is_archived', 'member_count', 'story_count', 'task_count',
            'progress_percentage', 'start_date', 'end_date', 'estimated_hours',
            'actual_hours', 'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()

    def get_story_count(self, obj):
        from apps.stories.models import UserStory
        return UserStory.objects.filter(project=obj).count()

    def get_task_count(self, obj):
        from apps.tasks.models import Task
        return Task.objects.filter(story__project=obj).count()

    def get_progress_percentage(self, obj):
        return obj.progress_percentage


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a project."""

    class Meta:
        model = Project
        fields = ['id', 'name', 'description']

    def validate_name(self, value):
        """Validate project name."""
        return validate_project_name(value)

    def validate_estimated_hours(self, value):
        """Validate estimated hours."""
        return validate_hours(value)

    def validate_actual_hours(self, value):
        """Validate actual hours."""
        return validate_hours(value)

    def validate_description(self, value):
        """Validate description for XSS."""
        if value:
            return sanitize_html(value)
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        project = Project.objects.create(owner=user, **validated_data)
        # Add owner as admin member
        ProjectMember.objects.create(
            project=project,
            user=user,
            role='admin',
            status='accepted',
        )
        return project


class ProjectMemberSerializer(serializers.ModelSerializer):
    """Project member serializer with user details."""
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = ProjectMember
        fields = ['id', 'project', 'user', 'user_detail', 'role', 'status', 'joined_at']
        read_only_fields = ['id', 'project', 'joined_at', 'status']


class AddMemberSerializer(serializers.Serializer):
    """Serializer for adding a member to a project."""
    user_id = serializers.IntegerField()
    role = serializers.ChoiceField(
        choices=ProjectMember.Role.choices,
        default='viewer',
    )

    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError('User not found.')
        return value


class ChangeMemberRoleSerializer(serializers.Serializer):
    """Serializer for changing a member's role."""
    role = serializers.ChoiceField(choices=ProjectMember.Role.choices)

class ProjectInviteSerializer(serializers.Serializer):
    """Serializer for inviting a user."""
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError('User not found.')
        return value
