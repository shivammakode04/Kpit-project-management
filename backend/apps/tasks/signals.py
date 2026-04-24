from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from apps.tasks.models import Task, Comment
from apps.core.utils import create_notification, log_activity


@receiver(pre_save, sender=Task)
def track_task_changes(sender, instance, **kwargs):
    """Track assignment and status changes before save."""
    if not instance.pk:
        return

    try:
        old_task = Task.objects.get(pk=instance.pk)
    except Task.DoesNotExist:
        return

    instance._old_status = old_task.status
    instance._old_assigned_to = old_task.assigned_to_id


@receiver(post_save, sender=Task)
def notify_task_changes(sender, instance, created, **kwargs):
    """Send notifications on task assignment/status changes."""
    if created:
        if instance.assigned_to_id:
            create_notification(
                instance.assigned_to_id, 'task_assigned',
                f'You have been assigned to task "{instance.title}".',
            )
        return

    old_status = getattr(instance, '_old_status', None)
    old_assigned = getattr(instance, '_old_assigned_to', None)

    # Notify on assignment change
    if old_assigned != instance.assigned_to_id and instance.assigned_to_id:
        create_notification(
            instance.assigned_to_id, 'task_assigned',
            f'You have been assigned to task "{instance.title}".',
        )
        log_activity(
            instance.assigned_to_id,
            instance.story.project_id,
            f'assigned to task "{instance.title}"',
            'task', instance.id,
        )

    # Notify on status change
    if old_status and old_status != instance.status:
        recipients = set()
        if instance.created_by_id:
            recipients.add(instance.created_by_id)
        if instance.assigned_to_id:
            recipients.add(instance.assigned_to_id)

        for user_id in recipients:
            create_notification(
                user_id, 'task_status',
                f'Task "{instance.title}" status changed to {instance.get_status_display()}.',
            )


@receiver(post_save, sender=Comment)
def notify_comment_added(sender, instance, created, **kwargs):
    """Notify task assignee when a comment is added."""
    if not created:
        return

    task = instance.task
    if task.assigned_to_id and task.assigned_to_id != instance.user_id:
        create_notification(
            task.assigned_to_id, 'comment_added',
            f'{instance.user.username} commented on task "{task.title}".',
        )
