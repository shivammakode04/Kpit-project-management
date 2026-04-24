from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Team, TeamInvitation
from .serializers import TeamSerializer, TeamInvitationSerializer
from apps.users.models import CustomUser
from apps.users.serializers import UserSerializer
from apps.notifications.models import Notification


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer

    def get_queryset(self):
        return Team.objects.filter(Q(owner=self.request.user) | Q(members=self.request.user)).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'])
    def all_users(self, request, pk=None):
        team = self.get_object()
        users = CustomUser.objects.exclude(id__in=team.members.values_list('id', flat=True)).exclude(id=team.owner.id)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        team = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            invitee = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        invitation, created = TeamInvitation.objects.get_or_create(
            team=team, invitee=invitee,
            defaults={'inviter': request.user}
        )

        if not created:
            return Response({'error': 'Invitation already sent'}, status=status.HTTP_400_BAD_REQUEST)

        Notification.objects.create(
            user=invitee,
            type='team_invitation',
            message=f'{request.user.username} invited you to join team "{team.name}"'
        )

        return Response(TeamInvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)


class TeamInvitationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TeamInvitationSerializer

    def get_queryset(self):
        return TeamInvitation.objects.filter(invitee=self.request.user, status='pending')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        invitation = self.get_object()
        invitation.status = 'accepted'
        invitation.save()
        invitation.team.members.add(invitation.invitee)
        
        Notification.objects.create(
            user=invitation.inviter,
            type='team_invitation_accepted',
            message=f'{invitation.invitee.username} accepted your team invitation'
        )

        return Response({'status': 'accepted'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        invitation = self.get_object()
        invitation.status = 'rejected'
        invitation.save()
        return Response({'status': 'rejected'})
