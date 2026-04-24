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
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', TokenObtainPairView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('profile/avatar/', AvatarUploadView.as_view(), name='auth-avatar'),
    path('profile/password/', ChangePasswordView.as_view(), name='auth-password'),
    path('users/', UserListView.as_view(), name='user-list'),
]
