import csv
import io
from datetime import datetime

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from apps.projects.models import Project, ProjectMember
from apps.projects.serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectMemberSerializer,
    AddMemberSerializer,
    ChangeMemberRoleSerializer,
)
from apps.stories.models import UserStory
from apps.tasks.models import Task, ActivityLog
from apps.tasks.serializers import ActivityLogSerializer
from apps.core.permissions import IsProjectMember, IsProjectAdmin
from apps.core.utils import log_activity, create_notification


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


class ProjectExportView(APIView):
    """Export project data as CSV or PDF."""
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        export_format = request.query_params.get('format', 'csv')

        stories = UserStory.objects.filter(project=project)
        tasks = Task.objects.filter(
            story__project=project
        ).select_related('story', 'assigned_to', 'created_by')

        if export_format == 'csv':
            return self._export_csv(project, stories, tasks)
        elif export_format == 'pdf':
            return self._export_pdf(project, stories, tasks)
        return Response(
            {'detail': 'Invalid format. Use csv or pdf.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def _export_csv(self, project, stories, tasks):
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'Task ID', 'Task Title', 'Story', 'Status',
            'Priority', 'Assigned To', 'Due Date', 'Created At',
        ])
        for task in tasks:
            writer.writerow([
                task.id,
                task.title,
                task.story.title,
                task.status,
                task.priority,
                task.assigned_to.username if task.assigned_to else '',
                task.due_date or '',
                task.created_at.strftime('%Y-%m-%d %H:%M'),
            ])

        response = HttpResponse(output.getvalue(), content_type='text/csv')
        filename = f'{project.name}_export_{datetime.now():%Y%m%d}.csv'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def _export_pdf(self, project, stories, tasks):
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib import colors
            from reportlab.lib.units import inch
            from reportlab.platypus import (
                SimpleDocTemplate, Table, TableStyle,
                Paragraph, Spacer,
            )
            from reportlab.lib.styles import getSampleStyleSheet
        except ImportError:
            return Response(
                {'detail': 'PDF export requires reportlab. Install it with: pip install reportlab'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph(f'Project: {project.name}', styles['Title']))
        elements.append(Spacer(1, 0.25 * inch))
        elements.append(Paragraph(
            f'Exported: {datetime.now():%Y-%m-%d %H:%M}',
            styles['Normal'],
        ))
        elements.append(Spacer(1, 0.5 * inch))

        # Tasks table
        data = [['ID', 'Title', 'Story', 'Status', 'Priority', 'Assigned', 'Due']]
        for task in tasks:
            data.append([
                str(task.id),
                task.title[:30],
                task.story.title[:20],
                task.status,
                task.priority,
                task.assigned_to.username if task.assigned_to else '-',
                str(task.due_date) if task.due_date else '-',
            ])

        if len(data) > 1:
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f0f5')]),
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph('No tasks found.', styles['Normal']))

        doc.build(elements)
        buffer.seek(0)

        response = HttpResponse(buffer, content_type='application/pdf')
        filename = f'{project.name}_export_{datetime.now():%Y%m%d}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
