from django.db import models
from django.conf import settings


class Notification(models.Model):
    """In-app notification."""
    
    TYPE_CHOICES = [
        ('task_assigned', 'Task Assigned'),
        ('task_updated', 'Task Updated'),
        ('task_completed', 'Task Completed'),
        ('story_assigned', 'Story Assigned'),
        ('story_updated', 'Story Updated'),
        ('project_invite', 'Project Invite'),
        ('team_invitation', 'Team Invitation'),
        ('team_invitation_accepted', 'Team Invitation Accepted'),
        ('deadline_reminder', 'Deadline Reminder'),
        ('comment_added', 'Comment Added'),
        ('project_updated', 'Project Updated'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255, default='Notification')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    related_object_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.type}] {self.title}'
