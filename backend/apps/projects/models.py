from django.db import models
from django.conf import settings


class Project(models.Model):
    """Project model."""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_projects',
    )
    is_archived = models.BooleanField(default=False)
    # Enhanced fields for agile project management
    start_date = models.DateField(null=True, blank=True, help_text="Project start date")
    end_date = models.DateField(null=True, blank=True, help_text="Project end date")
    estimated_hours = models.IntegerField(null=True, blank=True, help_text="Estimated total hours for project")
    actual_hours = models.IntegerField(null=True, blank=True, help_text="Actual hours spent on project")
    status = models.CharField(
        max_length=20,
        choices=[
            ('planning', 'Planning'),
            ('active', 'Active'),
            ('on_hold', 'On Hold'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled'),
        ],
        default='planning',
        help_text="Current project status"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def progress_percentage(self):
        """Calculate project progress based on tasks."""
        from apps.tasks.models import Task
        total_tasks = Task.objects.filter(story__project=self).count()
        completed_tasks = Task.objects.filter(story__project=self, status='done').count()
        if total_tasks == 0:
            return 0
        return round((completed_tasks / total_tasks) * 100, 1)


class ProjectMember(models.Model):
    """Project membership with role."""

    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        MEMBER = 'member', 'Member'
        VIEWER = 'viewer', 'Viewer'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='members',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_memberships',
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_members'
        unique_together = ['project', 'user']
        ordering = ['-joined_at']

    def __str__(self):
        return f'{self.user.username} → {self.project.name} ({self.role})'
