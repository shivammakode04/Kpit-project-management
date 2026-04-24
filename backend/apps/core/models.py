from django.db import models
from django.conf import settings


class SecurityLog(models.Model):
    """Model to log security events for monitoring."""
    
    EVENT_TYPES = [
        ('login_failed', 'Login Failed'),
        ('login_success', 'Login Success'),
        ('permission_denied', 'Permission Denied'),
        ('rate_limit_exceeded', 'Rate Limit Exceeded'),
        ('suspicious_activity', 'Suspicious Activity'),
        ('file_upload_blocked', 'File Upload Blocked'),
        ('xss_attempt', 'XSS Attempt'),
        ('sql_injection_attempt', 'SQL Injection Attempt'),
    ]
    
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='security_logs',
    )
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'security_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.event_type} - {self.ip_address}'
