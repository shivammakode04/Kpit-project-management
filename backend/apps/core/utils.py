import csv
import io
from datetime import datetime
from django.http import HttpResponse
from apps.notifications.models import Notification
from apps.tasks.models import ActivityLog


def create_notification(user_id, notification_type, message, project_id=None, related_object_id=None):
    """Create a notification for a user."""
    Notification.objects.create(
        user_id=user_id,
        type=notification_type,
        message=message,
        project_id=project_id,
        related_object_id=related_object_id,
    )


def generate_csv_report(data, filename):
    """Generate CSV report from data."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    if data:
        writer.writerow(data[0].keys())
    
    # Write data rows
    for row in data:
        writer.writerow(row.values())
    
    response = HttpResponse(
        output.getvalue(),
        content_type='text/csv',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )
    return response


def format_project_data(project):
    """Format project data for export."""
    from apps.tasks.models import Task
    from apps.stories.models import UserStory
    
    # Get project statistics
    total_tasks = Task.objects.filter(story__project=project).count()
    completed_tasks = Task.objects.filter(story__project=project, status='done').count()
    total_stories = UserStory.objects.filter(project=project).count()
    completed_stories = UserStory.objects.filter(project=project, status='done').count()
    
    # Format tasks data (assigned_to is ManyToManyField)
    tasks_data = []
    tasks = Task.objects.filter(
        story__project=project
    ).select_related('story', 'created_by').prefetch_related('assigned_to')
    
    for task in tasks:
        assigned_names = ', '.join([u.username for u in task.assigned_to.all()])
        tasks_data.append({
            'ID': task.id,
            'Title': task.title,
            'Description': task.description[:200] + '...' if len(task.description) > 200 else task.description,
            'Status': task.status,
            'Priority': task.priority,
            'Type': task.task_type,
            'Assigned To': assigned_names or 'Unassigned',
            'Story': task.story.title,
            'Due Date': task.due_date.strftime('%Y-%m-%d') if task.due_date else '',
            'Estimated Hours': str(task.estimated_hours or ''),
            'Actual Hours': str(task.actual_hours or ''),
            'Created At': task.created_at.strftime('%Y-%m-%d %H:%M'),
        })
    
    # Format stories data
    stories_data = []
    stories = UserStory.objects.filter(project=project).select_related('created_by')
    
    for story in stories:
        stories_data.append({
            'ID': story.id,
            'Title': story.title,
            'Description': story.description[:200] + '...' if len(story.description) > 200 else story.description,
            'Status': story.status,
            'Priority': story.priority,
            'Story Points': story.story_points or 0,
            'Business Value': story.business_value or '',
            'Created By': story.created_by.username if story.created_by else '',
            'Created At': story.created_at.strftime('%Y-%m-%d %H:%M'),
        })
    
    return {
        'project_info': {
            'Name': project.name,
            'Description': project.description,
            'Owner': project.owner.username,
            'Status': project.status,
            'Start Date': project.start_date.strftime('%Y-%m-%d') if project.start_date else '',
            'End Date': project.end_date.strftime('%Y-%m-%d') if project.end_date else '',
            'Created At': project.created_at.strftime('%Y-%m-%d %H:%M'),
        },
        'statistics': {
            'Total Tasks': total_tasks,
            'Completed Tasks': completed_tasks,
            'Total Stories': total_stories,
            'Completed Stories': completed_stories,
            'Completion Rate': round((completed_tasks / total_tasks * 100), 1) if total_tasks else 0,
        },
        'tasks': tasks_data,
        'stories': stories_data,
    }


def log_activity(user_id, project_id, action, target_type=None, target_id=None):
    """Log an activity event."""
    ActivityLog.objects.create(
        user_id=user_id,
        project_id=project_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
    )


ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES + [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def validate_file_upload(file, allowed_types=None):
    """Validate uploaded file MIME type and size."""
    if allowed_types is None:
        allowed_types = ALLOWED_FILE_TYPES

    if file.size > MAX_FILE_SIZE:
        raise ValueError(f'File size exceeds {MAX_FILE_SIZE // (1024 * 1024)}MB limit.')

    if file.content_type not in allowed_types:
        raise ValueError(
            f'File type {file.content_type} is not allowed. '
            f'Allowed: {", ".join(allowed_types)}'
        )

    return True
