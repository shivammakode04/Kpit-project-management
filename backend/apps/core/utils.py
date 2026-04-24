from apps.notifications.models import Notification
from apps.tasks.models import ActivityLog


def create_notification(user_id, notification_type, message):
    """Create a notification for a user."""
    Notification.objects.create(
        user_id=user_id,
        type=notification_type,
        message=message,
    )


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
