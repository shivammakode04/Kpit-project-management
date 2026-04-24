import logging
import os

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

_scheduler = None


def start_scheduler():
    """Start the APScheduler background scheduler."""
    global _scheduler

    # Prevent double-start in Django's auto-reloader
    if os.environ.get('RUN_MAIN') != 'true' and os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        # Only skip in development reloader child process detection
        if _scheduler is not None:
            return

    if _scheduler is not None:
        return

    _scheduler = BackgroundScheduler()

    # Deadline reminder — every hour
    _scheduler.add_job(
        _run_deadline_reminder,
        trigger=IntervalTrigger(hours=1),
        id='deadline_reminder',
        name='Deadline Reminder',
        replace_existing=True,
    )

    # Notification cleanup — daily at 3 AM
    _scheduler.add_job(
        _run_notification_cleanup,
        trigger=CronTrigger(hour=3, minute=0),
        id='notification_cleanup',
        name='Notification Cleanup',
        replace_existing=True,
    )

    _scheduler.start()
    logger.info('APScheduler started with deadline_reminder and notification_cleanup jobs.')


def _run_deadline_reminder():
    """Wrapper to import and run deadline reminder within Django context."""
    import django
    django.setup()
    from apps.jobs.tasks import deadline_reminder
    deadline_reminder()


def _run_notification_cleanup():
    """Wrapper to import and run notification cleanup within Django context."""
    import django
    django.setup()
    from apps.jobs.tasks import notification_cleanup
    notification_cleanup()


def trigger_job(job_type):
    """Manually trigger a background job."""
    from apps.jobs.tasks import deadline_reminder, notification_cleanup

    job_map = {
        'deadline_reminder': deadline_reminder,
        'notification_cleanup': notification_cleanup,
    }

    func = job_map.get(job_type)
    if not func:
        raise ValueError(f'Unknown job type: {job_type}')

    return func()
