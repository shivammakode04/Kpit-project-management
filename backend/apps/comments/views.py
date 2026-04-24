from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.comments.models import Comment
from apps.comments.serializers import CommentSerializer, CommentCreateSerializer
from apps.tasks.models import Task
from apps.core.permissions import IsTaskMember


class CommentListCreateView(generics.ListCreateAPIView):
    """List or create comments for a task."""
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated, IsTaskMember]

    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return Comment.objects.filter(task_id=task_id).select_related('user').order_by('-created_at')

    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_id')
        serializer.save(user=self.request.user, task_id=task_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a comment."""
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        task_id = self.kwargs.get('task_id')
        comment_id = self.kwargs.get('comment_id')
        return get_object_or_404(
            Comment.objects.get(id=comment_id, task_id=task_id)
        )

    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return Comment.objects.filter(task_id=task_id).select_related('user')

    def perform_update(self, serializer, instance):
        serializer.save(user=self.request.user)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
