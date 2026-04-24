import bleach
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.html import strip_tags
import re


def sanitize_html(content, allowed_tags=None):
    """Sanitize HTML content to prevent XSS attacks."""
    if allowed_tags is None:
        allowed_tags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    
    # Use bleach to clean HTML
    cleaned = bleach.clean(
        content,
        tags=allowed_tags,
        attributes={},
        strip=True,
        strip_comments=True
    )
    
    return cleaned


def validate_file_upload(file):
    """Validate uploaded files for security."""
    # Check file size (max 10MB)
    if file.size > 10 * 1024 * 1024:
        raise ValidationError('File size cannot exceed 10MB.')
    
    # Check file extension
    allowed_extensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.zip']
    file_extension = file.name.lower().split('.')[-1]
    
    if f'.{file_extension}' not in allowed_extensions:
        raise ValidationError(
            f'File type .{file_extension} is not allowed. '
            f'Allowed types: {", ".join(allowed_extensions)}'
        )
    
    # Check for malicious file names
    dangerous_patterns = [
        r'\.exe$', r'\.bat$', r'\.cmd$', r'\.scr$',
        r'\.pif$', r'\.com$', r'\.vbs$', r'\.js$',
        r'\.jar$', r'\.app$', r'\.deb$', r'\.pkg$'
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, file.name, re.IGNORECASE):
            raise ValidationError('File type is not allowed for security reasons.')
    
    return True


def sanitize_filename(filename):
    """Sanitize filename to prevent directory traversal."""
    # Remove directory traversal attempts
    filename = filename.replace('..', '').replace('/', '').replace('\\', '')
    
    # Remove null bytes
    filename = filename.replace('\x00', '')
    
    # Limit filename length
    if len(filename) > 255:
        name, extension = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + extension if extension else '')
    
    return filename.strip()


def get_client_ip(request):
    """Get client IP address for logging."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_security_event(request, event_type, details=None):
    """Log security events for monitoring."""
    from apps.core.models import SecurityLog
    
    SecurityLog.objects.create(
        event_type=event_type,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        details=details or {},
        user=request.user if request.user.is_authenticated else None
    )


class RateLimiter:
    """Simple rate limiter for API endpoints."""
    
    def __init__(self, max_requests=100, window_minutes=15):
        self.max_requests = max_requests
        self.window_minutes = window_minutes
        self.requests = {}
    
    def is_allowed(self, identifier):
        """Check if request is allowed based on rate limit."""
        from datetime import datetime, timedelta
        import time
        
        now = datetime.now()
        window_start = now - timedelta(minutes=self.window_minutes)
        
        # Clean old requests
        self.requests = {
            k: v for k, v in self.requests.items()
            if v['timestamp'] > window_start
        }
        
        # Count requests in window
        recent_requests = sum(1 for req in self.requests.values() if req['identifier'] == identifier)
        
        # Add current request
        self.requests[time.time()] = {'identifier': identifier, 'timestamp': now}
        
        return recent_requests < self.max_requests
