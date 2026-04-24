from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.stories.models import UserStory
from apps.stories.serializers import UserStorySerializer, UserStoryCreateSerializer
from apps.projects.models import Project, ProjectMember
from apps.core.permissions import IsProjectMember, IsProjectEditor
from apps.core.utils import log_activity


class StoryListCreateView(generics.ListCreateAPIView):
    """List stories for a project or create a new one."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserStoryCreateSerializer
        return UserStorySerializer

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        # Verify membership
        if not ProjectMember.objects.filter(
            project_id=project_id, user=self.request.user
        ).exists():
            return UserStory.objects.none()
        return UserStory.objects.filter(project_id=project_id)

    def create(self, request, *args, **kwargs):
        project_id = self.kwargs['project_id']
        project = get_object_or_404(Project, pk=project_id)

        # Check editor/admin role
        membership = ProjectMember.objects.filter(
            project=project, user=request.user, role__in=['admin', 'editor']
        ).first()
        if not membership:
            return Response(
                {'detail': 'Editors and admins only.'},
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


class StoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a user story."""
    serializer_class = UserStorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_project_ids = ProjectMember.objects.filter(
            user=self.request.user
        ).values_list('project_id', flat=True)
        return UserStory.objects.filter(project_id__in=user_project_ids)

    def update(self, request, *args, **kwargs):
        story = self.get_object()
        # Check editor permission
        if not ProjectMember.objects.filter(
            project=story.project, user=request.user,
            role__in=['admin', 'editor']
        ).exists():
            return Response(
                {'detail': 'Editors and admins only.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        story = serializer.save()
        log_activity(
            self.request.user.id, story.project_id,
            'updated story', 'story', story.id,
        )

    def destroy(self, request, *args, **kwargs):
        story = self.get_object()
        if not ProjectMember.objects.filter(
            project=story.project, user=request.user,
            role__in=['admin', 'editor']
        ).exists():
            return Response(
                {'detail': 'Editors and admins only.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        log_activity(
            request.user.id, story.project_id,
            'deleted story', 'story', story.id,
        )
        return super().destroy(request, *args, **kwargs)
