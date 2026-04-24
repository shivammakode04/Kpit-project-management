import re
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _


def validate_project_name(value):
    """Validate project name to prevent XSS and ensure proper format."""
    if not value:
        raise ValidationError(_('Project name is required.'))
    
    # Check for minimum length
    if len(value) < 3:
        raise ValidationError(_('Project name must be at least 3 characters long.'))
    
    # Check for maximum length
    if len(value) > 100:
        raise ValidationError(_('Project name cannot exceed 100 characters.'))
    
    # Check for script injection patterns
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'expression\s*\(',
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            raise ValidationError(_('Project name contains invalid characters.'))
    
    return value


def validate_task_title(value):
    """Validate task title to prevent XSS and ensure proper format."""
    if not value:
        raise ValidationError(_('Task title is required.'))
    
    if len(value) < 3:
        raise ValidationError(_('Task title must be at least 3 characters long.'))
    
    if len(value) > 200:
        raise ValidationError(_('Task title cannot exceed 200 characters.'))
    
    # Check for script injection
    if re.search(r'<script[^>]*>.*?</script>', value, re.IGNORECASE):
        raise ValidationError(_('Task title contains invalid characters.'))
    
    return value


def validate_story_points(value):
    """Validate story points to ensure they are positive integers."""
    if value is None:
        return None
    
    try:
        points = int(value)
        if points < 0:
            raise ValidationError(_('Story points must be a positive number.'))
        if points > 100:
            raise ValidationError(_('Story points cannot exceed 100.'))
        return points
    except (ValueError, TypeError):
        raise ValidationError(_('Story points must be a valid number.'))


def validate_hours(value):
    """Validate estimated and actual hours."""
    if value is None:
        return None
    
    try:
        hours = float(value)
        if hours < 0:
            raise ValidationError(_('Hours must be a positive number.'))
        if hours > 999:
            raise ValidationError(_('Hours cannot exceed 999.'))
        return hours
    except (ValueError, TypeError):
        raise ValidationError(_('Hours must be a valid number.'))


def validate_priority(value):
    """Validate priority field."""
    valid_priorities = ['low', 'medium', 'high', 'critical']
    if value not in valid_priorities:
        raise ValidationError(
            _('Priority must be one of: %(choices)s') % 
            {'choices': ', '.join(valid_priorities)}
        )
    return value


def validate_status(value):
    """Validate status field."""
    valid_statuses = ['todo', 'in_progress', 'done', 'blocked', 'testing']
    if value not in valid_statuses:
        raise ValidationError(
            _('Status must be one of: %(choices)s') % 
            {'choices': ', '.join(valid_statuses)}
        )
    return value


class SafeHTMLValidator:
    """Custom validator to allow safe HTML tags only."""
    
    def __init__(self, allowed_tags=None):
        if allowed_tags is None:
            allowed_tags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li']
        self.allowed_tags = allowed_tags
    
    def __call__(self, value):
        if not value:
            return value
        
        # Simple regex to check for dangerous HTML
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',
            r'<iframe[^>]*>.*?</iframe>',
            r'<object[^>]*>.*?</object>',
            r'<embed[^>]*>.*?</embed>',
            r'on\w+\s*=',
            r'javascript:',
            r'vbscript:',
            r'data:text/html',
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValidationError(_('HTML contains potentially dangerous content.'))
        
        # Check for only allowed tags
        tag_pattern = r'<(/?)(\w+)[^>]*>'
        matches = re.findall(tag_pattern, value, re.IGNORECASE)
        
        for match in matches:
            tag_name = match[1].lower()
            if tag_name not in self.allowed_tags:
                raise ValidationError(
                    _('HTML tag "%(tag)s" is not allowed.') % 
                    {'tag': tag_name}
                )
        
        return value
