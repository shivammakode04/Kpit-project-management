from django.db import models
from django.conf import settings


class Task(models.Model):
    """Task model belonging to a user story."""

    class Status(models.TextChoices):
        TODO = 'todo', 'To Do'
        IN_PROGRESS = 'in_progress', 'In Progress'
        DONE = 'done', 'Done'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    story = models.ForeignKey(
        'stories.UserStory',
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
    )
    due_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class TaskAttachment(models.Model):
    """File attachment for a task."""
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='attachments',
    )
    file = models.FileField(upload_to='attachments/')
    filename = models.CharField(max_length=255)
    file_size = models.IntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'task_attachments'
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.filename


class Comment(models.Model):
    """Comment on a task."""
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.user.username} on {self.task.title}'


class ActivityLog(models.Model):
    """Activity log entry."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activity_logs',
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='activity_logs',
    )
    action = models.CharField(max_length=255)
    target_type = models.CharField(max_length=50, blank=True, null=True)
    target_id = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} — {self.action}'
