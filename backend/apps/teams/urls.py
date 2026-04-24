from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, TeamInvitationViewSet

router = DefaultRouter()
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'invitations', TeamInvitationViewSet, basename='invitation')

urlpatterns = [
    path('', include(router.urls)),
]
