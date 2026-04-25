from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.notifications.models import Notification
from apps.core.utils import create_notification


class NotificationTestView(APIView):
    """Test endpoint for creating notifications - DEBUG ONLY"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create a test notification for the current user"""
        message = request.data.get('message', 'Test notification from admin')
        
        # Create notification directly
        notification = Notification.objects.create(
            user=request.user,
            type='project_invite',
            message=message
        )
        
        # Also test the utility function
        create_notification(
            user_id=request.user.id,
            notification_type='team_invitation',
            message=f'Test utility notification: {message}'
        )
        
        return Response({
            'detail': 'Test notifications created',
            'notification_id': notification.id,
            'user': request.user.username
        }, status=status.HTTP_201_CREATED)

    def get(self, request):
        """Get notification stats for current user"""
        notifications = Notification.objects.filter(user=request.user)
        unread_count = notifications.filter(is_read=False).count()
        
        return Response({
            'total_notifications': notifications.count(),
            'unread_count': unread_count,
            'recent_notifications': [
                {
                    'id': n.id,
                    'type': n.type,
                    'message': n.message,
                    'is_read': n.is_read,
                    'created_at': n.created_at
                }
                for n in notifications.order_by('-created_at')[:5]
            ]
        })