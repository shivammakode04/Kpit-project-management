from rest_framework import serializers
from apps.stories.models import UserStory


class UserStorySerializer(serializers.ModelSerializer):
    """UserStory serializer with creator info."""
    created_by_name = serializers.CharField(
        source='created_by.username', read_only=True,
    )
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = UserStory
        fields = [
            'id', 'project', 'title', 'description', 'acceptance_criteria',
            'status', 'priority', 'created_by', 'created_by_name',
            'task_count', 'story_points', 'business_value', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'project', 'created_by', 'created_at', 'updated_at']

    def get_task_count(self, obj):
        return obj.tasks.count()


class UserStoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a user story."""

    class Meta:
        model = UserStory
        fields = ['id', 'title', 'description', 'acceptance_criteria', 'status', 'priority', 'story_points', 'business_value']
