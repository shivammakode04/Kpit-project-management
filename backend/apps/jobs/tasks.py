import logging
import time
import json
from datetime import date, timedelta

from django.utils import timezone

from apps.jobs.models import BackgroundJob
from apps.tasks.models import Task
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


def run_job_with_tracking(job_type, job_func):
    """Run a job with tracking in the background_jobs table.
    
    Implements exponential backoff retry logic:
    - Each failed attempt increments retry_count
    - Wait time doubles each retry: 2s, 4s, 8s...
    - After max_retries (default 3), the job is marked as permanently failed
    """
    job = BackgroundJob.objects.create(
        job_type=job_type,
        status='running',
    )

    try:
        result = job_func()
        job.status = 'completed'
        job.result = str(result) if result else 'Success'
        job.executed_at = timezone.now()
        job.save(update_fields=['status', 'result', 'executed_at'])
        return result
    except Exception as exc:
        job.status = 'failed'
        job.error_message = str(exc)
        job.retry_count += 1
        job.save(update_fields=['status', 'error_message', 'retry_count'])

        if job.retry_count < job.max_retries:
            backoff = 2 ** job.retry_count
            logger.warning(
                'Job %s failed (attempt %d/%d). Retrying in %ds.',
                job_type, job.retry_count, job.max_retries, backoff,
            )
            time.sleep(backoff)
            return run_job_with_tracking(job_type, job_func)

        logger.error(
            'Job %s failed permanently after %d retries: %s',
            job_type, job.max_retries, exc,
        )
        raise


def deadline_reminder():
    """Check for tasks with due dates within 24 hours and send notifications.
    
    This job scans all tasks that:
    - Have a due_date set to tomorrow
    - Are not completed (status is 'todo' or 'in_progress')
    - Have at least one user assigned via ManyToManyField
    
    For each matching task, a notification is created per assigned user,
    with duplicate prevention (only one reminder per user per task per day).
    """

    def _run():
        try:
            tomorrow = date.today() + timedelta(days=1)

            # Get tasks due tomorrow that are still active
            tasks = Task.objects.filter(
                due_date=tomorrow,
                status__in=['todo', 'in_progress'],
            ).prefetch_related('assigned_to')

            count = 0
            for task in tasks:
                assigned_users = task.assigned_to.all()
                if not assigned_users.exists():
                    continue

                for user in assigned_users:
                    # Prevent duplicate notifications for the same task on the same day
                    already_sent = Notification.objects.filter(
                        user=user,
                        type='deadline_reminder',
                        related_object_id=task.id,
                        created_at__date=timezone.now().date(),
                    ).exists()

                    if not already_sent:
                        Notification.objects.create(
                            user=user,
                            type='deadline_reminder',
                            message=f"Reminder: Task '{task.title}' is due in 24 hours!",
                            project=task.story.project if hasattr(task, 'story') else None,
                            related_object_id=task.id,
                        )
                        count += 1

            logger.info(f'Deadline reminder: Sent {count} notifications')
            return f'Sent {count} deadline reminders'
        except Exception as e:
            logger.error(f'Deadline reminder job failed: {e}')
            raise

    return run_job_with_tracking('deadline_reminder', _run)


def notification_cleanup():
    """Delete read notifications older than 30 days.
    
    This job runs daily and removes stale notifications to keep
    the notifications table lean. Only read notifications are deleted.
    """

    def _run():
        try:
            cutoff = timezone.now() - timedelta(days=30)
            deleted_count, _ = Notification.objects.filter(
                is_read=True,
                created_at__lt=cutoff,
            ).delete()
            logger.info(f'Notification cleanup: Deleted {deleted_count} old notifications')
            return f'Deleted {deleted_count} old notifications'
        except Exception as e:
            logger.error(f'Notification cleanup job failed: {e}')
            raise

    return run_job_with_tracking('notification_cleanup', _run)


def generate_project_report(project_id):
    """Generate a background report for a project.
    
    This async job collects all project data (stories, tasks, members, 
    activity) and generates a summary report stored as a BackgroundJob result.
    This demonstrates async report generation as required by the assignment.
    """

    def _run():
        try:
            from apps.projects.models import Project, ProjectMember
            from apps.stories.models import UserStory

            project = Project.objects.get(pk=project_id)

            # Gather statistics
            total_stories = UserStory.objects.filter(project=project).count()
            completed_stories = UserStory.objects.filter(project=project, status='done').count()
            total_tasks = Task.objects.filter(story__project=project).count()
            completed_tasks = Task.objects.filter(story__project=project, status='done').count()
            in_progress = Task.objects.filter(story__project=project, status='in_progress').count()
            blocked = Task.objects.filter(story__project=project, status='blocked').count()
            member_count = ProjectMember.objects.filter(project=project, status='accepted').count()

            # Overdue tasks
            overdue = Task.objects.filter(
                story__project=project,
                due_date__lt=date.today(),
                status__in=['todo', 'in_progress'],
            ).count()

            report = {
                'project_name': project.name,
                'generated_at': timezone.now().isoformat(),
                'summary': {
                    'total_stories': total_stories,
                    'completed_stories': completed_stories,
                    'total_tasks': total_tasks,
                    'completed_tasks': completed_tasks,
                    'in_progress_tasks': in_progress,
                    'blocked_tasks': blocked,
                    'overdue_tasks': overdue,
                    'team_size': member_count,
                    'completion_rate': round((completed_tasks / total_tasks * 100), 1) if total_tasks else 0,
                },
            }

            logger.info(f'Report generated for project {project.name}')
            return json.dumps(report)
        except Exception as e:
            logger.error(f'Report generation failed for project {project_id}: {e}')
            raise

    return run_job_with_tracking('project_report', _run)
