from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
from django.contrib import admin
from UpToDate import settings
admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^$', include("frontend.urls")),
    url(r'^api/', include("backend.urls")),
    url(r'^admin/', include(admin.site.urls)),
) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

