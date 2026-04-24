from django.urls import path

from apps.jobs.views import JobListView, TriggerJobView

urlpatterns = [
    path('jobs/', JobListView.as_view(), name='job-list'),
    path('jobs/trigger/', TriggerJobView.as_view(), name='job-trigger'),
]
