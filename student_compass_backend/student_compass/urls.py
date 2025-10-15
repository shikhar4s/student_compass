from django.contrib import admin
from django.urls import path, include
from .view import render_react_app
from django.conf.urls.static import static
from .settings import STATIC_ROOT, STATIC_URL

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', render_react_app)
]

urlpatterns += static(STATIC_URL, document_root=STATIC_ROOT)