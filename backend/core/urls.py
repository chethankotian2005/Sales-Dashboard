"""
URL configuration for Sales Dashboard project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_health(request):
    """Health check endpoint for Vercel"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'Sales Dashboard API',
        'version': '1.0.0'
    })

urlpatterns = [
    path('', api_health, name='api_health'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]
