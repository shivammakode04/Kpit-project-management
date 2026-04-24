from rest_framework import serializers
from django.contrib.auth import get_user_model

from apps.projects.models import Project, ProjectMember
from apps.users.serializers import UserSerializer

User = get_user_model()


class ProjectSerializer(serializers.ModelSerializer):
    """Project serializer with owner info and member count."""
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'owner', 'owner_name',
            'is_archived', 'member_count', 'created_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at']

    def get_member_count(self, obj):
        return obj.members.count()


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a project."""

    class Meta:
        model = Project
        fields = ['id', 'name', 'description']

    def create(self, validated_data):
        user = self.context['request'].user
        project = Project.objects.create(owner=user, **validated_data)
        # Add owner as admin member
        ProjectMember.objects.create(
            project=project,
            user=user,
            role='admin',
        )
        return project


class ProjectMemberSerializer(serializers.ModelSerializer):
    """Project member serializer with user details."""
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = ProjectMember
        fields = ['id', 'project', 'user', 'user_detail', 'role', 'joined_at']
        read_only_fields = ['id', 'project', 'joined_at']


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
