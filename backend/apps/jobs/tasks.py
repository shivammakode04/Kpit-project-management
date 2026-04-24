import logging
import time
from datetime import date, timedelta

from django.utils import timezone

from apps.jobs.models import BackgroundJob
from apps.tasks.models import Task
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


def run_job_with_tracking(job_type, job_func):
    """Run a job with tracking in the background_jobs table."""
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

        # Retry with exponential backoff
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
    """Check for tasks with upcoming deadlines and send notifications."""

    def _run():
        today = date.today()
        tomorrow = today + timedelta(days=1)

        tasks = Task.objects.filter(
            due_date__in=[today, tomorrow],
            assigned_to__isnull=False,
        ).exclude(status='done').select_related('assigned_to')

        count = 0
        for task in tasks:
            is_today = task.due_date == today
            urgency = 'today' if is_today else 'tomorrow'

            Notification.objects.create(
                user=task.assigned_to,
                type='deadline_reminder',
                message=f'Task "{task.title}" is due {urgency}!',
            )
            count += 1

        return f'Sent {count} deadline reminders'

    return run_job_with_tracking('deadline_reminder', _run)


def notification_cleanup():
    """Delete read notifications older than 30 days."""

    def _run():
        cutoff = timezone.now() - timedelta(days=30)
        deleted_count, _ = Notification.objects.filter(
            is_read=True,
            created_at__lt=cutoff,
        ).delete()
        return f'Deleted {deleted_count} old notifications'

    return run_job_with_tracking('notification_cleanup', _run)
