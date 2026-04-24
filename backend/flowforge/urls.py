from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # API
    path('api/auth/', include('apps.users.urls')),
    path('api/', include('apps.projects.urls')),
    path('api/', include('apps.stories.urls')),
    path('api/', include('apps.tasks.urls')),
    path('api/', include('apps.notifications.urls')),
    path('api/', include('apps.jobs.urls')),
    path('api/', include('apps.core.urls')),
    path('api/', include('apps.teams.urls')),
    # OpenAPI / Swagger
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
