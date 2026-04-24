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
from apps.projects.models import ProjectMember
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
            'assigned_to', 'created_by', 'story'
        )

        # Filters
        task_status = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        assigned_to = self.request.query_params.get('assigned_to')

        if task_status:
            qs = qs.filter(status=task_status)
        if priority:
            qs = qs.filter(priority=priority)
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)

        return qs

    def create(self, request, *args, **kwargs):
        story = get_object_or_404(UserStory, pk=self.kwargs['story_id'])
        # Check editor/admin role
        if not ProjectMember.objects.filter(
            project=story.project, user=request.user,
            role__in=['admin', 'editor']
        ).exists():
            return Response(
                {'detail': 'Editors and admins only.'},
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
        ).select_related('assigned_to', 'created_by', 'story')

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        if not ProjectMember.objects.filter(
            project=task.story.project, user=request.user,
            role__in=['admin', 'editor']
        ).exists():
            return Response(
                {'detail': 'Editors and admins only.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        task = serializer.save()
        log_activity(
            self.request.user.id, task.story.project_id,
            'updated task', 'task', task.id,
        )

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        if not ProjectMember.objects.filter(
            project=task.story.project, user=request.user,
            role__in=['admin', 'editor']
        ).exists():
            return Response(
                {'detail': 'Editors and admins only.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        log_activity(
            request.user.id, task.story.project_id,
            'deleted task', 'task', task.id,
        )
        return super().destroy(request, *args, **kwargs)


class TaskStatusView(APIView):
    """Update task status."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        if not ProjectMember.objects.filter(
            project=task.story.project, user=request.user,
            role__in=['admin', 'editor']
        ).exists():
            return Response(
                {'detail': 'Editors and admins only.'},
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
    """Assign a task to a user."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        if not ProjectMember.objects.filter(
            project=task.story.project, user=request.user,
            role__in=['admin', 'editor']
        ).exists():
            return Response(
                {'detail': 'Editors and admins only.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TaskAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        assigned_to = serializer.validated_data['assigned_to']
        if assigned_to is not None:
            # Verify assignee is a project member
            if not ProjectMember.objects.filter(
                project=task.story.project, user_id=assigned_to
            ).exists():
                return Response(
                    {'detail': 'User is not a project member.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        task.assigned_to_id = assigned_to
        task.save(update_fields=['assigned_to'])

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
            role__in=['admin', 'editor']
        ).exists():
            return Response(
                {'detail': 'Editors and admins only.'},
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
