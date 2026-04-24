from django.urls import path

from apps.tasks.views import (
    TaskListCreateView,
    TaskDetailView,
    TaskStatusView,
    TaskAssignView,
    CommentListCreateView,
    CommentDeleteView,
    TaskAttachmentListView,
    MyTasksView,
    ProjectTasksView,
)

urlpatterns = [
    path('tasks/my/', MyTasksView.as_view(), name='my-tasks'),
    path('projects/<int:project_id>/tasks/', ProjectTasksView.as_view(), name='project-tasks'),
    path('stories/<int:story_id>/tasks/', TaskListCreateView.as_view(), name='task-list'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:pk>/status/', TaskStatusView.as_view(), name='task-status'),
    path('tasks/<int:pk>/assign/', TaskAssignView.as_view(), name='task-assign'),
    path('tasks/<int:task_id>/comments/', CommentListCreateView.as_view(), name='comment-list'),
    path('tasks/<int:task_id>/attachments/', TaskAttachmentListView.as_view(), name='task-attachments'),
    path('comments/<int:pk>/', CommentDeleteView.as_view(), name='comment-delete'),
]
