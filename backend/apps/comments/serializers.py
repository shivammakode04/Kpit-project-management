from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.comments.models import Comment
from apps.users.serializers import UserSerializer

User = get_user_model()

class CommentSerializer(serializers.ModelSerializer):
    """Comment serializer with user details."""
    user_detail = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'task', 'user', 'user_detail', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments."""
    
    class Meta:
        model = Comment
        fields = ['content']
