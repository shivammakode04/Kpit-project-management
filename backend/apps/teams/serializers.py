from rest_framework import serializers
from .models import Team, TeamInvitation
from apps.users.serializers import UserSerializer


class TeamSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'owner', 'members', 'member_count', 'created_at']


class TeamInvitationSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)
    inviter = UserSerializer(read_only=True)
    invitee = UserSerializer(read_only=True)

    class Meta:
        model = TeamInvitation
        fields = ['id', 'team', 'inviter', 'invitee', 'status', 'created_at', 'updated_at']
