from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.projects.models import Project, ProjectMember
from apps.projects.serializers import ProjectMemberSerializer
from apps.users.models import CustomUser
from apps.users.serializers import UserSerializer
from apps.core.permissions import IsProjectMember, IsProjectAdmin
from apps.core.utils import log_activity
from apps.notifications.models import Notification
from apps.stories.models import UserStory
from apps.tasks.models import Task
from apps.stories.serializers import UserStorySerializer
from apps.tasks.serializers import TaskSerializer


class ProjectStoriesView(generics.ListCreateAPIView):
    """List and create stories for a project."""
    serializer_class = UserStorySerializer
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get_queryset(self):
        return UserStory.objects.filter(project=self.kwargs['pk']).select_related('created_by')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            from apps.stories.serializers import UserStoryCreateSerializer
            return UserStoryCreateSerializer
        return UserStorySerializer
    
    def create(self, request, *args, **kwargs):
        project_id = self.kwargs['pk']
        project = get_object_or_404(Project, pk=project_id)

        # Check admin or member role
        if request.user.role not in ['admin', 'member']:
            return Response(
                {'detail': 'Only admins and members can create stories.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Also check project membership with accepted status
        membership = ProjectMember.objects.filter(
            project=project, user=request.user, status='accepted'
        ).first()
        if not membership:
            return Response(
                {'detail': 'Not an accepted project member.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        story = serializer.save(project=project, created_by=request.user)

        log_activity(
            request.user.id, project.id,
            'created story', 'story', story.id,
        )
        return Response(
            UserStorySerializer(story).data,
            status=status.HTTP_201_CREATED,
        )

class ProjectTasksView(generics.ListAPIView):
    """List tasks for a project."""
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get_queryset(self):
        return Task.objects.filter(story__project=self.kwargs['pk']).select_related('story', 'assigned_to', 'created_by')


class ProjectUsersDirectoryView(APIView):
    """Get all users in the database for inviting."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        
        # Check if user is admin
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Only admins can access user directory.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get all users excluding current project members
        existing_member_ids = ProjectMember.objects.filter(project=project).values_list('user_id', flat=True)
        users = CustomUser.objects.exclude(id__in=existing_member_ids)

        # Search by name or email
        search_query = request.query_params.get('q', '')
        if search_query:
            users = users.filter(
                Q(username__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(full_name__icontains=search_query)
            )

        return Response(UserSerializer(users, many=True).data)


class ProjectInviteAcceptView(APIView):
    """Accept a project invitation."""
    permission_classes = [IsAuthenticated]

    def post(self, request, member_id):
        member = get_object_or_404(ProjectMember, pk=member_id, user=request.user)

        if member.status == 'accepted':
            return Response(
                {'detail': 'Invitation already accepted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member.status = 'accepted'
        member.save(update_fields=['status'])

        # Mark related invite notifications as read
        Notification.objects.filter(
            user=request.user,
            type='project_invite',
            related_object_id=member.id,
        ).update(is_read=True)

        log_activity(
            request.user.id, member.project_id,
            'accepted project invitation', 'member', request.user.id,
        )

        return Response(ProjectMemberSerializer(member).data)
