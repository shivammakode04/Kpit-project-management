from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings
from .utils import send_deadline_reminders, send_weekly_project_reports


def start():
    """Start the notification scheduler."""
    scheduler = BackgroundScheduler()
    
    # Schedule daily deadline reminders at 9 AM
    scheduler.add_job(
        send_deadline_reminders,
        trigger=CronTrigger(hour=9, minute=0),
        id='deadline_reminders',
        name='Send deadline reminders',
        replace_existing=True,
    )
    
    # Schedule weekly project reports on Friday at 5 PM
    scheduler.add_job(
        send_weekly_project_reports,
        trigger=CronTrigger(day_of_week='fri', hour=17, minute=0),
        id='weekly_reports',
        name='Send weekly project reports',
        replace_existing=True,
    )
    
    scheduler.start()
    
    if settings.DEBUG:
        print("Notification scheduler started")
        print("Scheduled jobs:")
        for job in scheduler.get_jobs():
            print(f"  - {job.name}: {job.trigger}")


def stop():
    """Stop the notification scheduler."""
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        scheduler = BackgroundScheduler()
        scheduler.shutdown(wait=False)
        if settings.DEBUG:
            print("Notification scheduler stopped")
    except:
        pass
