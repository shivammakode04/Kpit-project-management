from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from apps.projects.models import Project, ProjectMember
from apps.stories.models import UserStory
from apps.tasks.models import Task
from apps.projects.serializers import ProjectSerializer
from apps.stories.serializers import UserStorySerializer
from apps.tasks.serializers import TaskSerializer


class GlobalSearchView(APIView):
    """Global search across projects, stories, and tasks."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        project_id = request.query_params.get('project_id')
        status = request.query_params.get('status')
        priority = request.query_params.get('priority')
        assigned_to = request.query_params.get('assigned_to')

        if not query and not any([project_id, status, priority, assigned_to]):
            return Response({'projects': [], 'stories': [], 'tasks': []})

        # Get user's project IDs for scoping
        user_project_ids = ProjectMember.objects.filter(
            user=request.user
        ).values_list('project_id', flat=True)

        # Search projects
        projects_qs = Project.objects.filter(
            id__in=user_project_ids, is_archived=False
        )
        if query:
            projects_qs = projects_qs.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            )

        # Search stories
        stories_qs = UserStory.objects.filter(project_id__in=user_project_ids)
        if query:
            stories_qs = stories_qs.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            )
        if project_id:
            stories_qs = stories_qs.filter(project_id=project_id)
        if status:
            stories_qs = stories_qs.filter(status=status)
        if priority:
            stories_qs = stories_qs.filter(priority=priority)

        # Search tasks
        tasks_qs = Task.objects.filter(
            story__project_id__in=user_project_ids
        )
        if query:
            tasks_qs = tasks_qs.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            )
        if project_id:
            tasks_qs = tasks_qs.filter(story__project_id=project_id)
        if status:
            tasks_qs = tasks_qs.filter(status=status)
        if priority:
            tasks_qs = tasks_qs.filter(priority=priority)
        if assigned_to:
            tasks_qs = tasks_qs.filter(assigned_to_id=assigned_to)

        return Response({
            'projects': ProjectSerializer(projects_qs[:10], many=True).data,
            'stories': UserStorySerializer(stories_qs[:10], many=True).data,
            'tasks': TaskSerializer(tasks_qs[:20], many=True).data,
        })
