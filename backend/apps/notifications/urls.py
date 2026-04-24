from django.urls import path

from apps.notifications.views import (
    NotificationListView,
    NotificationReadView,
    NotificationMarkAllReadView,
    NotificationUnreadCountView,
)

urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', NotificationReadView.as_view(), name='notification-read'),
    path('notifications/mark-all-read/', NotificationMarkAllReadView.as_view(), name='notification-mark-all'),
    path('notifications/unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
]
