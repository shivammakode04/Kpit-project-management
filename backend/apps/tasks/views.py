from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from apps.tasks.models import Task, TaskAttachment, Comment
from apps.tasks.serializers import (
    TaskSerializer,
    TaskCreateSerializer,
    TaskStatusSerializer,
    TaskAssignSerializer,
    CommentSerializer,
    CommentCreateSerializer,
    TaskAttachmentSerializer,
    TaskAttachmentUploadSerializer,
)
from apps.stories.models import UserStory
from apps.projects.models import ProjectMember, Project
from apps.core.utils import log_activity


class TaskListCreateView(generics.ListCreateAPIView):
    """List tasks for a story or create a new one."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TaskCreateSerializer
        return TaskSerializer

    def get_queryset(self):
        story_id = self.kwargs['story_id']
        story = get_object_or_404(UserStory, pk=story_id)
        # Verify membership
        if not ProjectMember.objects.filter(
            project=story.project, user=self.request.user
        ).exists():
            return Task.objects.none()

        qs = Task.objects.filter(story_id=story_id).select_related(
            'created_by', 'story'
        ).prefetch_related('assigned_to')

        # Filters
        task_status = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        assigned_to = self.request.query_params.get('assigned_to')

        if task_status:
            qs = qs.filter(status=task_status)
        if priority:
            qs = qs.filter(priority=priority)
        if assigned_to:
            qs = qs.filter(assigned_to__id=assigned_to)

        return qs

    def create(self, request, *args, **kwargs):
        story = get_object_or_404(UserStory, pk=self.kwargs['story_id'])
        # Check member/admin role
        if not ProjectMember.objects.filter(
            project=story.project, user=request.user,
            role__in=['admin', 'member']
        ).exists():
            return Response(
                {'detail': 'Members and admins only.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save(story=story, created_by=request.user)

        log_activity(
            request.user.id, story.project_id,
            'created task', 'task', task.id,
        )
        return Response(
            TaskSerializer(task).data,
            status=status.HTTP_201_CREATED,
        )


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a task."""
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_project_ids = ProjectMember.objects.filter(
            user=self.request.user
        ).values_list('project_id', flat=True)
        return Task.objects.filter(
            story__project_id__in=user_project_ids
        ).select_related('created_by', 'story').prefetch_related('assigned_to')


class MyTasksView(generics.ListAPIView):
    """List tasks assigned to the current user."""
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(
            assigned_to=self.request.user
        ).select_related('created_by', 'story').prefetch_related('assigned_to').order_by('-created_at')


class ProjectTasksView(generics.ListAPIView):
    """List all tasks in a project for Kanban board."""
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        project = get_object_or_404(Project, pk=project_id)
        
        # Verify user is project member
        if not ProjectMember.objects.filter(
            project=project, user=self.request.user
        ).exists():
            return Task.objects.none()

        return Task.objects.filter(
            story__project_id=project_id
        ).select_related('created_by', 'story').prefetch_related('assigned_to').order_by('status', '-created_at')


class TaskStatusView(APIView):
    """Update task status."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        if not ProjectMember.objects.filter(
            project=task.story.project, user=request.user,
            role__in=['admin', 'member']
        ).exists():
            return Response(
                {'detail': 'Members and admins only.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TaskStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = task.status
        task.status = serializer.validated_data['status']
        task.save(update_fields=['status'])

        log_activity(
            request.user.id, task.story.project_id,
            f'changed task status from {old_status} to {task.status}',
            'task', task.id,
        )
        return Response(TaskSerializer(task).data)


class TaskAssignView(APIView):
    """Assign a task to multiple users."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        if not ProjectMember.objects.filter(
            project=task.story.project, user=request.user,
            role__in=['admin', 'member']
        ).exists():
            return Response(
                {'detail': 'Members and admins only.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TaskAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        assigned_to_ids = serializer.validated_data['assigned_to']
        
        # Verify all assignees are project members
        if assigned_to_ids:
            valid_members = ProjectMember.objects.filter(
                project=task.story.project, user_id__in=assigned_to_ids
            ).values_list('user_id', flat=True)
            
            if len(valid_members) != len(assigned_to_ids):
                return Response(
                    {'detail': 'Some users are not project members.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        task.assigned_to.set(assigned_to_ids)

        log_activity(
            request.user.id, task.story.project_id,
            'assigned task', 'task', task.id,
        )
        return Response(TaskSerializer(task).data)


class CommentListCreateView(generics.ListCreateAPIView):
    """List or add comments on a task."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommentCreateSerializer
        return CommentSerializer

    def get_queryset(self):
        task = get_object_or_404(Task, pk=self.kwargs['task_id'])
        if not ProjectMember.objects.filter(
            project=task.story.project, user=self.request.user
        ).exists():
            return Comment.objects.none()
        return Comment.objects.filter(task_id=self.kwargs['task_id']).select_related('user')

    def create(self, request, *args, **kwargs):
        task = get_object_or_404(Task, pk=self.kwargs['task_id'])
        if not ProjectMember.objects.filter(
            project=task.story.project, user=request.user
        ).exists():
            return Response(
                {'detail': 'Not a project member.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(task=task, user=request.user)

        log_activity(
            request.user.id, task.story.project_id,
            'added comment', 'comment', comment.id,
        )
        return Response(
            CommentSerializer(comment).data,
            status=status.HTTP_201_CREATED,
        )


class CommentDeleteView(generics.DestroyAPIView):
    """Delete own comment."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(user=self.request.user)


class TaskAttachmentListView(APIView):
    """List and upload task attachments."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        if not ProjectMember.objects.filter(
            project=task.story.project, user=request.user
        ).exists():
            return Response(
                {'detail': 'Not a project member.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        attachments = TaskAttachment.objects.filter(task=task)
        return Response(TaskAttachmentSerializer(attachments, many=True).data)

    def post(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        if not ProjectMember.objects.filter(
            project=task.story.project, user=request.user,
            role__in=['admin', 'member']
        ).exists():
            return Response(
                {'detail': 'Members and admins only.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TaskAttachmentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data['file']
        attachment = TaskAttachment.objects.create(
            task=task,
            file=file,
            filename=file.name,
            file_size=file.size,
            uploaded_by=request.user,
        )

        log_activity(
            request.user.id, task.story.project_id,
            'uploaded attachment', 'attachment', attachment.id,
        )
        return Response(
            TaskAttachmentSerializer(attachment).data,
            status=status.HTTP_201_CREATED,
        )
