from django.urls import path

from apps.projects.views import (
    ProjectListCreateView,
    ProjectDetailView,
    ProjectArchiveView,
    ProjectMemberListView,
    ProjectMemberRemoveView,
    ProjectMemberRoleView,
    ProjectActivityView,
    ProjectAnalyticsView,
    ProjectInviteView,
    ProjectExportView,
    ProjectReportView,
)
from apps.projects.views_extended import (
    ProjectUsersDirectoryView,
    ProjectInviteAcceptView,
    ProjectStoriesView,
    ProjectTasksView,
)

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view(), name='project-list'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:pk>/archive/', ProjectArchiveView.as_view(), name='project-archive'),
    path('projects/<int:pk>/members/', ProjectMemberListView.as_view(), name='project-members'),
    path('projects/<int:pk>/users-directory/', ProjectUsersDirectoryView.as_view(), name='project-users-directory'),
    path('projects/<int:pk>/members/<int:user_id>/', ProjectMemberRemoveView.as_view(), name='project-member-remove'),
    path('projects/<int:pk>/members/<int:user_id>/role/', ProjectMemberRoleView.as_view(), name='project-member-role'),
    path('projects/<int:pk>/invite/', ProjectInviteView.as_view(), name='project-invite'),
    path('projects/invites/<int:member_id>/accept/', ProjectInviteAcceptView.as_view(), name='project-invite-accept'),
    path('projects/<int:pk>/activity/', ProjectActivityView.as_view(), name='project-activity'),
    path('projects/<int:pk>/analytics/', ProjectAnalyticsView.as_view(), name='project-analytics'),
    path('projects/<int:pk>/stories/', ProjectStoriesView.as_view(), name='project-stories'),
    path('projects/<int:pk>/tasks/', ProjectTasksView.as_view(), name='project-tasks'),
    path('projects/<int:pk>/export/', ProjectExportView.as_view(), name='project-export'),
    path('projects/<int:pk>/report/', ProjectReportView.as_view(), name='project-report'),
]
