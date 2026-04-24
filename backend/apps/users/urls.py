from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from apps.users.views import (
    RegisterView,
    ProfileView,
    AvatarUploadView,
    ChangePasswordView,
    UserListView,
    UserDetailView,
    UserUpdateRoleView,
    UserToggleActiveView,
    UserWorkloadView,
    MyTasksView,
    GlobalActivityView,
    WorkspaceStatsView,
)

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', TokenObtainPairView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    # Profile
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('profile/avatar/', AvatarUploadView.as_view(), name='auth-avatar'),
    path('profile/password/', ChangePasswordView.as_view(), name='auth-password'),
    # Users
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/role/', UserUpdateRoleView.as_view(), name='user-role'),
    path('users/<int:pk>/toggle-active/', UserToggleActiveView.as_view(), name='user-toggle-active'),
    path('users/<int:pk>/workload/', UserWorkloadView.as_view(), name='user-workload'),
    # My workspace
    path('my/tasks/', MyTasksView.as_view(), name='my-tasks'),
    path('my/activity/', GlobalActivityView.as_view(), name='my-activity'),
    path('my/stats/', WorkspaceStatsView.as_view(), name='my-stats'),
]
