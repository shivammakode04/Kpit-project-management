import csv
import io
import json
from datetime import datetime

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.db import models

from apps.projects.models import Project, ProjectMember
from apps.projects.serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectMemberSerializer,
    AddMemberSerializer,
    ChangeMemberRoleSerializer,
    ProjectInviteSerializer,
)
from apps.core.permissions import IsProjectMember, IsProjectAdmin
from apps.core.utils import log_activity, create_notification
from apps.stories.models import UserStory
from apps.stories.serializers import UserStorySerializer
from apps.tasks.models import Task, ActivityLog
from apps.tasks.serializers import ActivityLogSerializer


class ProjectListCreateView(generics.ListCreateAPIView):
    """List user's projects or create a new one."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_queryset(self):
        user_project_ids = ProjectMember.objects.filter(
            user=self.request.user
        ).values_list('project_id', flat=True)
        return Project.objects.filter(id__in=user_project_ids)

    def perform_create(self, serializer):
        project = serializer.save()
        log_activity(
            self.request.user.id, project.id,
            'created project', 'project', project.id,
        )


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a project."""
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_project_ids = ProjectMember.objects.filter(
            user=self.request.user
        ).values_list('project_id', flat=True)
        return Project.objects.filter(id__in=user_project_ids)

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsProjectAdmin()]
        return [IsAuthenticated(), IsProjectMember()]

    def perform_update(self, serializer):
        project = serializer.save()
        log_activity(
            self.request.user.id, project.id,
            'updated project', 'project', project.id,
        )

    def perform_destroy(self, instance):
        log_activity(
            self.request.user.id, instance.id,
            'deleted project', 'project', instance.id,
        )
        instance.delete()


class ProjectArchiveView(APIView):
    """Archive or unarchive a project."""
    permission_classes = [IsAuthenticated, IsProjectAdmin]

    def post(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        project.is_archived = not project.is_archived
        project.save(update_fields=['is_archived'])
        action = 'archived' if project.is_archived else 'unarchived'
        log_activity(
            request.user.id, project.id,
            f'{action} project', 'project', project.id,
        )
        return Response(ProjectSerializer(project).data)


class ProjectMemberListView(APIView):
    """List or add members to a project."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        # Check membership
        if not ProjectMember.objects.filter(project=project, user=request.user).exists():
            return Response(
                {'detail': 'Not a project member.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        members = ProjectMember.objects.filter(project=project).select_related('user')
        status_param = request.query_params.get('status')
        if status_param:
            members = members.filter(status=status_param)
        return Response(ProjectMemberSerializer(members, many=True).data)

    def post(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        # Only admin can add members
        if not ProjectMember.objects.filter(
            project=project, user=request.user, role='admin'
        ).exists():
            return Response(
                {'detail': 'Only project admin can add members.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data['user_id']
        role = serializer.validated_data['role']

        if ProjectMember.objects.filter(project=project, user_id=user_id).exists():
            return Response(
                {'detail': 'User is already a member.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member = ProjectMember.objects.create(
            project=project, user_id=user_id, role=role,
        )
        log_activity(
            request.user.id, project.id,
            f'added member (role: {role})', 'member', user_id,
        )
        create_notification(
            user_id, 'member_added',
            f'You have been added to project "{project.name}" as {role}.',
        )
        return Response(
            ProjectMemberSerializer(member).data,
            status=status.HTTP_201_CREATED,
        )

class ProjectInviteView(APIView):
    """Invite a user to a project."""
    permission_classes = [IsAuthenticated, IsProjectAdmin]

    def post(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        serializer = ProjectInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data['user_id']

        if ProjectMember.objects.filter(project=project, user_id=user_id).exists():
            return Response(
                {'detail': 'User is already a member or invited.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member = ProjectMember.objects.create(
            project=project, user_id=user_id, role='member', status='pending'
        )

        create_notification(
            user_id, 'project_invite',
            f'You have been invited to join project "{project.name}"',
            project_id=project.id,
            related_object_id=member.id,
        )
        log_activity(
            request.user.id, project.id,
            f'invited user to project', 'member', user_id,
        )
        return Response(
            ProjectMemberSerializer(member).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectMemberRemoveView(APIView):
    """Remove a member from a project."""
    permission_classes = [IsAuthenticated, IsProjectAdmin]

    def delete(self, request, pk, user_id):
        project = get_object_or_404(Project, pk=pk)
        member = get_object_or_404(
            ProjectMember, project=project, user_id=user_id,
        )
        if member.role == 'admin' and member.user == project.owner:
            return Response(
                {'detail': 'Cannot remove the project owner.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        member.delete()
        log_activity(
            request.user.id, project.id,
            'removed member', 'member', user_id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectMemberRoleView(APIView):
    """Change a member's role."""
    permission_classes = [IsAuthenticated, IsProjectAdmin]

    def patch(self, request, pk, user_id):
        project = get_object_or_404(Project, pk=pk)
        member = get_object_or_404(
            ProjectMember, project=project, user_id=user_id,
        )
        serializer = ChangeMemberRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member.role = serializer.validated_data['role']
        member.save(update_fields=['role'])
        log_activity(
            request.user.id, project.id,
            f'changed role to {member.role}', 'member', user_id,
        )
        return Response(ProjectMemberSerializer(member).data)


class ProjectActivityView(generics.ListAPIView):
    """List activity logs for a project."""
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get_queryset(self):
        return ActivityLog.objects.filter(
            project_id=self.kwargs['pk']
        ).select_related('user')


class ProjectAnalyticsView(APIView):
    """Get project analytics data."""
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        
        # Calculate analytics
        total_tasks = Task.objects.filter(story__project=project).count()
        completed_tasks = Task.objects.filter(story__project=project, status='done').count()
        in_progress_tasks = Task.objects.filter(story__project=project, status='in_progress').count()
        todo_tasks = Task.objects.filter(story__project=project, status='todo').count()
        blocked_tasks = Task.objects.filter(story__project=project, status='blocked').count()
        testing_tasks = Task.objects.filter(story__project=project, status='testing').count()
        
        total_stories = UserStory.objects.filter(project=project).count()
        completed_stories = UserStory.objects.filter(project=project, status='done').count()
        
        # Calculate total hours
        total_estimated = Task.objects.filter(story__project=project).aggregate(
            models.Sum('estimated_hours')
        )['estimated_hours__sum'] or 0
        
        total_actual = Task.objects.filter(story__project=project).aggregate(
            models.Sum('actual_hours')
        )['actual_hours__sum'] or 0
        
        # Calculate average story points
        avg_points = UserStory.objects.filter(project=project).aggregate(
            models.Avg('story_points')
        )['story_points__avg'] or 0

        # Member count
        member_count = ProjectMember.objects.filter(
            project=project, status='accepted'
        ).count()

        analytics = {
            'totalTasks': total_tasks,
            'completedTasks': completed_tasks,
            'inProgressTasks': in_progress_tasks,
            'todoTasks': todo_tasks,
            'blockedTasks': blocked_tasks,
            'testingTasks': testing_tasks,
            'totalStories': total_stories,
            'completedStories': completed_stories,
            'totalHours': float(total_estimated),
            'actualHours': float(total_actual),
            'averageStoryPoints': float(avg_points),
            'memberCount': member_count,
            'completionRate': round((completed_tasks / total_tasks * 100), 1) if total_tasks else 0,
        }
        
        return Response(analytics)


class ProjectExportView(APIView):
    """Export project data as CSV or PDF."""
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        export_format = request.query_params.get('format', 'csv')

        if export_format == 'csv':
            return self._export_csv(project)
        elif export_format == 'json':
            return self._export_json(project)
        else:
            return Response(
                {'detail': f'Unsupported format: {export_format}. Use csv or json.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _export_csv(self, project):
        """Generate CSV export of all tasks in the project."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'Task ID', 'Task Title', 'Description', 'Status', 'Priority',
            'Type', 'Story', 'Assigned To', 'Due Date',
            'Estimated Hours', 'Actual Hours', 'Created At',
        ])
        
        tasks = Task.objects.filter(
            story__project=project
        ).select_related('story', 'created_by').prefetch_related('assigned_to')
        
        for task in tasks:
            assigned_names = ', '.join([u.username for u in task.assigned_to.all()])
            writer.writerow([
                task.id,
                task.title,
                task.description[:200] if task.description else '',
                task.get_status_display(),
                task.get_priority_display(),
                task.get_task_type_display() if hasattr(task, 'get_task_type_display') else task.task_type,
                task.story.title,
                assigned_names or 'Unassigned',
                task.due_date.strftime('%Y-%m-%d') if task.due_date else '',
                str(task.estimated_hours or ''),
                str(task.actual_hours or ''),
                task.created_at.strftime('%Y-%m-%d %H:%M'),
            ])
        
        response = HttpResponse(
            output.getvalue(),
            content_type='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename="{project.name}_tasks.csv"'
            },
        )
        return response

    def _export_json(self, project):
        """Generate JSON export of the entire project."""
        from apps.core.utils import format_project_data
        data = format_project_data(project)
        return Response(data)


class ProjectReportView(APIView):
    """Trigger async report generation for a project."""
    permission_classes = [IsAuthenticated, IsProjectMember]

    def post(self, request, pk):
        """Trigger background report generation."""
        project = get_object_or_404(Project, pk=pk)
        
        from apps.jobs.scheduler import trigger_report
        import threading

        def run_in_background():
            try:
                trigger_report(project.id)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f'Report generation failed: {e}')

        thread = threading.Thread(target=run_in_background, daemon=True)
        thread.start()

        log_activity(
            request.user.id, project.id,
            'triggered report generation', 'project', project.id,
        )

        return Response({
            'detail': f'Report generation started for "{project.name}". Check background jobs for status.',
        }, status=status.HTTP_202_ACCEPTED)
