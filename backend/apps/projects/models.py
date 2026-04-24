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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    """Project membership with role."""

    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        EDITOR = 'editor', 'Editor'
        VIEWER = 'viewer', 'Viewer'

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
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_members'
        unique_together = ['project', 'user']
        ordering = ['-joined_at']

    def __str__(self):
        return f'{self.user.username} → {self.project.name} ({self.role})'
