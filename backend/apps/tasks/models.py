from django.db import models
from django.conf import settings


class Task(models.Model):
    """Task model belonging to a user story."""

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
    assigned_to = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='assigned_tasks',
        blank=True,
    )
    due_date = models.DateField(null=True, blank=True)
    # Enhanced fields for agile task management
    estimated_hours = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Estimated hours to complete this task"
    )
    actual_hours = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Actual hours spent on this task"
    )
    task_type = models.CharField(
        max_length=50,
        choices=[
            ('feature', 'Feature'),
            ('bug', 'Bug Fix'),
            ('enhancement', 'Enhancement'),
            ('research', 'Research'),
            ('testing', 'Testing'),
        ],
        default='feature',
        help_text="Type of work for this task"
    )
    labels = models.JSONField(default=list, blank=True, help_text="Task labels for categorization")
    is_blocked = models.BooleanField(default=False, help_text="Whether task is blocked by dependencies")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def time_spent_percentage(self):
        """Calculate percentage of estimated time spent."""
        if not self.estimated_hours or self.estimated_hours == 0:
            return 0
        if not self.actual_hours:
            return 0
        return round((float(self.actual_hours) / float(self.estimated_hours)) * 100, 1)


class TaskAttachment(models.Model):
    """File attachment for a task."""
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='attachments',
    )
    file = models.FileField(upload_to='task_attachments/')
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    content_type = models.CharField(max_length=100, default='application/octet-stream')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_attachments',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'task_attachments'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.filename} - {self.task.title}'

    @property
    def file_extension(self):
        return self.filename.split('.')[-1].lower() if '.' in self.filename else ''

    @property
    def is_image(self):
        image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
        return self.file_extension in image_extensions

    @property
    def is_document(self):
        doc_extensions = ['pdf', 'doc', 'docx', 'txt', 'rtf']
        return self.file_extension in doc_extensions

    @property
    def file_size_display(self):
        """Return human-readable file size."""
        if self.file_size < 1024:
            return f"{self.file_size} B"
        elif self.file_size < 1024 * 1024:
            return f"{self.file_size / 1024:.1f} KB"
        else:
            return f"{self.file_size / (1024 * 1024):.1f} MB"


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
        related_name='task_comments',
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
