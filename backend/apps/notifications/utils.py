from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from apps.notifications.models import Notification
from apps.tasks.models import Task
from apps.stories.models import UserStory
from apps.projects.models import Project


def create_notification(user, notification_type, title, message, project=None, related_object_id=None):
    """Create a notification for a user."""
    Notification.objects.create(
        user=user,
        type=notification_type,
        title=title,
        message=message,
        project=project,
        related_object_id=related_object_id,
    )


def send_deadline_reminders():
    """Send deadline reminders for tasks and stories."""
    tomorrow = timezone.now() + timedelta(days=1)
    
    # Check for tasks due tomorrow
    tasks_due = Task.objects.filter(
        due_date__date=tomorrow.date(),
        status__in=['todo', 'in_progress']
    ).select_related('assigned_to', 'story__project')
    
    for task in tasks_due:
        if task.assigned_to:
            create_notification(
                user=task.assigned_to,
                notification_type='deadline_reminder',
                title=f'Task Due Tomorrow: {task.title}',
                message=f'Your task "{task.title}" is due tomorrow. Please complete it or update the deadline.',
                project=task.story.project,
                related_object_id=task.id,
            )
    
    # Check for stories with tasks due tomorrow
    stories_with_tasks = UserStory.objects.filter(
        tasks__due_date__date=tomorrow.date(),
        tasks__status__in=['todo', 'in_progress']
    ).distinct().select_related('project')
    
    for story in stories_with_tasks:
        if story.created_by:
            create_notification(
                user=story.created_by,
                notification_type='deadline_reminder',
                title=f'Story Tasks Due Tomorrow: {story.title}',
                message=f'Tasks in your story "{story.title}" are due tomorrow.',
                project=story.project,
                related_object_id=story.id,
            )


def send_weekly_project_reports():
    """Send weekly project progress reports to project owners."""
    one_week_ago = timezone.now() - timedelta(days=7)
    
    projects = Project.objects.filter(
        is_archived=False
    ).select_related('owner')
    
    for project in projects:
        # Calculate weekly progress
        completed_tasks = Task.objects.filter(
            story__project=project,
            updated_at__gte=one_week_ago,
            status='done'
        ).count()
        
        total_tasks = Task.objects.filter(
            story__project=project,
            updated_at__gte=one_week_ago
        ).count()
        
        new_stories = UserStory.objects.filter(
            project=project,
            created_at__gte=one_week_ago
        ).count()
        
        # Send email report to project owner
        if project.owner and project.owner.email:
            subject = f'Weekly Project Report: {project.name}'
            message = f'''
            Weekly Progress Report for {project.name}
            
            Tasks Completed This Week: {completed_tasks}/{total_tasks}
            New Stories Created: {new_stories}
            
            View full details: {settings.FRONTEND_URL}/projects/{project.id}
            '''
            
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[project.owner.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Failed to send weekly report for project {project.id}: {e}")


def notify_task_assignment(task, assigned_user):
    """Send notification when a task is assigned."""
    create_notification(
        user=assigned_user,
        notification_type='task_assigned',
        title=f'New Task Assigned: {task.title}',
        message=f'You have been assigned a new task: {task.title}',
        project=task.story.project,
        related_object_id=task.id,
    )


def notify_task_update(task, updated_by):
    """Send notification when a task is updated."""
    # Notify task assignee if updated by someone else
    if task.assigned_to and task.assigned_to != updated_by:
        create_notification(
            user=task.assigned_to,
            notification_type='task_updated',
            title=f'Task Updated: {task.title}',
            message=f'Task "{task.title}" has been updated by {updated_by.username}',
            project=task.story.project,
            related_object_id=task.id,
        )


def notify_task_completion(task):
    """Send notification when a task is completed."""
    # Notify project owner and story creator
    users_to_notify = []
    if task.story.project.owner and task.story.project.owner != task.assigned_to:
        users_to_notify.append(task.story.project.owner)
    if task.story.created_by and task.story.created_by != task.assigned_to:
        users_to_notify.append(task.story.created_by)
    
    for user in set(users_to_notify):
        create_notification(
            user=user,
            notification_type='task_completed',
            title=f'Task Completed: {task.title}',
            message=f'Task "{task.title}" has been marked as completed.',
            project=task.story.project,
            related_object_id=task.id,
        )
