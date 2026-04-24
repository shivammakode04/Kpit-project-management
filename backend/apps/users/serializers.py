from rest_framework import serializers
from django.contrib.auth import get_user_model

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
            'avatar_url', 'role', 'created_at',
        ]
        read_only_fields = fields


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for profile viewing and editing."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name',
            'avatar_url', 'role', 'created_at',
        ]
        read_only_fields = ['id', 'username', 'role', 'created_at']


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
