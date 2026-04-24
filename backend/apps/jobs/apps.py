import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class JobsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.jobs'
    verbose_name = 'Background Jobs'

    def ready(self):
        from apps.jobs.scheduler import start_scheduler
        try:
            start_scheduler()
        except Exception:
            logger.warning('Failed to start APScheduler — may already be running.')
