from django.urls import path

from apps.projects.views import (
    ProjectListCreateView,
    ProjectDetailView,
    ProjectArchiveView,
    ProjectMemberListView,
    ProjectMemberRemoveView,
    ProjectMemberRoleView,
    ProjectActivityView,
    ProjectExportView,
)

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view(), name='project-list'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:pk>/archive/', ProjectArchiveView.as_view(), name='project-archive'),
    path('projects/<int:pk>/members/', ProjectMemberListView.as_view(), name='project-members'),
    path('projects/<int:pk>/members/<int:user_id>/', ProjectMemberRemoveView.as_view(), name='project-member-remove'),
    path('projects/<int:pk>/members/<int:user_id>/role/', ProjectMemberRoleView.as_view(), name='project-member-role'),
    path('projects/<int:pk>/activity/', ProjectActivityView.as_view(), name='project-activity'),
    path('projects/<int:pk>/export/', ProjectExportView.as_view(), name='project-export'),
]
