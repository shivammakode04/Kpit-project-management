from django.urls import path

from apps.stories.views import StoryListCreateView, StoryDetailView

urlpatterns = [
    path('projects/<int:project_id>/stories/', StoryListCreateView.as_view(), name='story-list'),
    path('stories/<int:pk>/', StoryDetailView.as_view(), name='story-detail'),
]
