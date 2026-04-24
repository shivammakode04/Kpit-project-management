from django.db import models
from django.conf import settings


class UserStory(models.Model):
    """User story model."""

    class Status(models.TextChoices):
        TODO = 'todo', 'To Do'
        IN_PROGRESS = 'in_progress', 'In Progress'
        DONE = 'done', 'Done'
        BLOCKED = 'blocked', 'Blocked'
        TESTING = 'testing', 'Testing'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='stories',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    acceptance_criteria = models.TextField(blank=True, default='', help_text="Definition of done for this story")
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
    story_points = models.IntegerField(null=True, blank=True, help_text="Story points for estimation")
    business_value = models.CharField(
        max_length=50,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
        ],
        default='medium',
        help_text="Business value for prioritization"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_stories',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_stories'
        ordering = ['-priority', 'created_at']
        verbose_name_plural = 'User stories'

    def __str__(self):
        return self.title

    @property
    def task_count(self):
        """Count of tasks in this story."""
        return self.tasks.count()

    @property
    def completed_task_count(self):
        """Count of completed tasks."""
        return self.tasks.filter(status='done').count()

    @property
    def story_progress(self):
        """Calculate story progress based on tasks."""
        total = self.task_count
        completed = self.completed_task_count
        if total == 0:
            return 0
        return round((completed / total) * 100, 1)
