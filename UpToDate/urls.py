from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^$', include("frontend.urls")),
    url(r'^api/', include("backend.urls")),
    url(r'^admin/', include(admin.site.urls)),
)

