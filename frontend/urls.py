from django.conf.urls import patterns, url
from frontend import views

""" URL setup (kinda like htaccess) """

urlpatterns = patterns(
    '',
    url(r'^$', views.main, name="main"),
)
