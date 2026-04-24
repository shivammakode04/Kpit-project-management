from django.db import models


class BackgroundJob(models.Model):
    """Background job tracking model."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        RUNNING = 'running', 'Running'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    job_type = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    payload = models.TextField(blank=True, null=True)
    result = models.TextField(blank=True, null=True)
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    error_message = models.TextField(blank=True, null=True)
    scheduled_at = models.DateTimeField(auto_now_add=True)
    executed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'background_jobs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.job_type} — {self.status}'
