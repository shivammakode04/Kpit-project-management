from django.db import models
from django.conf import settings

class Comment(models.Model):
    """Comment model for tasks."""
    
    task = models.ForeignKey(
        'tasks.Task',
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
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.user.username} on {self.task.title}'
