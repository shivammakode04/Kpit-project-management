from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.db import models
from django.shortcuts import get_object_or_404

from apps.users.serializers import (
    RegisterSerializer,
    ProfileSerializer,
    AvatarUploadSerializer,
    ChangePasswordSerializer,
    UserSerializer,
    UserDetailSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new user account."""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """View and update current user profile."""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class AvatarUploadView(APIView):
    """Upload or replace avatar image."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = AvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        # Delete old avatar file if it exists
        if user.avatar_url:
            user.avatar_url.delete(save=False)

        user.avatar_url = serializer.validated_data['avatar']
        user.save(update_fields=['avatar_url'])

        return Response(
            ProfileSerializer(user).data,
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    """Change authenticated user password."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password updated successfully.'})


class UserListView(generics.ListAPIView):
    """List all users (for admin panel and member assignment)."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = User.objects.all()
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                models.Q(username__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(full_name__icontains=search)
            )
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs


class UserDetailView(APIView):
    """Get detailed user info with stats (admin only)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserDetailSerializer(user)
        return Response(serializer.data)


class UserUpdateRoleView(APIView):
    """Admin: Change a user's global role."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Only admins can change user roles.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        user = get_object_or_404(User, pk=pk)
        new_role = request.data.get('role')
        if new_role not in ['admin', 'member', 'viewer']:
            return Response(
                {'detail': 'Invalid role. Must be admin, member, or viewer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Prevent self-demotion
        if user == request.user and new_role != 'admin':
            return Response(
                {'detail': 'Cannot change your own role.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.role = new_role
        user.save(update_fields=['role'])
        return Response(UserSerializer(user).data)


class UserToggleActiveView(APIView):
    """Admin: Activate or deactivate a user."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Only admins can manage users.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        user = get_object_or_404(User, pk=pk)
        if user == request.user:
            return Response(
                {'detail': 'Cannot deactivate yourself.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        action = 'activated' if user.is_active else 'deactivated'
        return Response({
            'detail': f'User {user.username} has been {action}.',
            'user': UserSerializer(user).data,
        })


class UserWorkloadView(APIView):
    """Get workload summary for a user across all projects."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        from apps.tasks.models import Task
        from apps.projects.models import ProjectMember

        tasks = Task.objects.filter(assigned_to=user)
        total = tasks.count()
        by_status = {
            'todo': tasks.filter(status='todo').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'done': tasks.filter(status='done').count(),
            'blocked': tasks.filter(status='blocked').count(),
            'testing': tasks.filter(status='testing').count(),
        }
        by_priority = {
            'critical': tasks.filter(priority='critical').count(),
            'high': tasks.filter(priority='high').count(),
            'medium': tasks.filter(priority='medium').count(),
            'low': tasks.filter(priority='low').count(),
        }
        overdue = tasks.filter(
            due_date__lt=models.functions.Now(),
            status__in=['todo', 'in_progress', 'blocked'],
        ).count()
        project_count = ProjectMember.objects.filter(
            user=user, status='accepted'
        ).count()

        return Response({
            'user_id': user.id,
            'username': user.username,
            'total_tasks': total,
            'by_status': by_status,
            'by_priority': by_priority,
            'overdue_tasks': overdue,
            'project_count': project_count,
        })


class MyTasksView(APIView):
    """Get current user's tasks across all projects, with optional filters."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.tasks.models import Task
        from apps.tasks.serializers import TaskSerializer

        tasks = Task.objects.filter(
            assigned_to=request.user
        ).select_related('story', 'story__project', 'created_by').prefetch_related('assigned_to')

        # Filters
        status_filter = request.query_params.get('status')
        if status_filter:
            tasks = tasks.filter(status=status_filter)

        priority = request.query_params.get('priority')
        if priority:
            tasks = tasks.filter(priority=priority)

        project_id = request.query_params.get('project')
        if project_id:
            tasks = tasks.filter(story__project_id=project_id)

        task_type = request.query_params.get('type')
        if task_type:
            tasks = tasks.filter(task_type=task_type)

        search = request.query_params.get('search', '').strip()
        if search:
            tasks = tasks.filter(
                models.Q(title__icontains=search) |
                models.Q(description__icontains=search)
            )

        # Sort
        sort = request.query_params.get('sort', '-created_at')
        valid_sorts = ['created_at', '-created_at', 'due_date', '-due_date', 'priority', '-priority', 'status', '-status']
        if sort in valid_sorts:
            tasks = tasks.order_by(sort)

        # Group by status for kanban-like view
        group_by = request.query_params.get('group_by')
        if group_by == 'status':
            grouped = {}
            for s_val, s_label in Task.Status.choices:
                grouped[s_val] = TaskSerializer(
                    tasks.filter(status=s_val), many=True
                ).data
            return Response({
                'grouped': grouped,
                'total': tasks.count(),
            })

        serializer = TaskSerializer(tasks[:100], many=True)
        return Response({
            'count': tasks.count(),
            'results': serializer.data,
        })


class GlobalActivityView(APIView):
    """Get activity feed across all user's projects."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.tasks.models import ActivityLog
        from apps.tasks.serializers import ActivityLogSerializer
        from apps.projects.models import ProjectMember

        user_project_ids = ProjectMember.objects.filter(
            user=request.user, status='accepted'
        ).values_list('project_id', flat=True)

        logs = ActivityLog.objects.filter(
            project_id__in=user_project_ids
        ).select_related('user', 'project').order_by('-created_at')[:50]

        serializer = ActivityLogSerializer(logs, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data,
        })


class WorkspaceStatsView(APIView):
    """Get workspace-wide statistics for the dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.tasks.models import Task
        from apps.stories.models import UserStory
        from apps.projects.models import Project, ProjectMember

        user_project_ids = ProjectMember.objects.filter(
            user=request.user, status='accepted'
        ).values_list('project_id', flat=True)

        total_projects = Project.objects.filter(
            id__in=user_project_ids, is_archived=False
        ).count()
        total_stories = UserStory.objects.filter(
            project_id__in=user_project_ids
        ).count()
        total_tasks = Task.objects.filter(
            story__project_id__in=user_project_ids
        ).count()
        my_tasks = Task.objects.filter(assigned_to=request.user).count()
        my_done = Task.objects.filter(assigned_to=request.user, status='done').count()
        my_in_progress = Task.objects.filter(assigned_to=request.user, status='in_progress').count()
        my_overdue = Task.objects.filter(
            assigned_to=request.user,
            due_date__lt=models.functions.Now(),
            status__in=['todo', 'in_progress', 'blocked'],
        ).count()
        total_members = User.objects.filter(is_active=True).count()

        return Response({
            'total_projects': total_projects,
            'total_stories': total_stories,
            'total_tasks': total_tasks,
            'my_tasks': my_tasks,
            'my_done': my_done,
            'my_in_progress': my_in_progress,
            'my_overdue': my_overdue,
            'total_members': total_members,
        })
