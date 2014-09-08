from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
from django.contrib import admin
from UpToDate import settings
import frontend

""" URL setup (kinda like htaccess) """

admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^$', include("frontend.urls")),
    url(r'^about/$', frontend.views.about, name="about"),
    url(r'^api/', include("backend.urls")),
    url(r'^admin/', include(admin.site.urls)),
) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

