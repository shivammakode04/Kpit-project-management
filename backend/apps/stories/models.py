from django.db import models
from django.conf import settings


class UserStory(models.Model):
    """User story model."""

    class Status(models.TextChoices):
        TODO = 'todo', 'To Do'
        IN_PROGRESS = 'in_progress', 'In Progress'
        DONE = 'done', 'Done'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='stories',
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
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_stories',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_stories'
        ordering = ['-created_at']
        verbose_name_plural = 'User stories'

    def __str__(self):
        return self.title
