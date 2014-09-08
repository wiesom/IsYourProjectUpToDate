from django.shortcuts import render
from backend.views import PROJECT_FILES

def main(request):
    project_types = PROJECT_FILES
    pages = _get_pages("home")
    return render(request, 'index.html', locals())


def about(request):
    links = {
        "web": "http://www.ninetwozero.com",
        "gplus": "https://plus.google.com/+KarlLindmark",
        "twitter": "https://www.twitter.com/karllindmark",
        "facebook": "https://www.facebook.com/ninetwozero",
        "email": "mailto:support+iyputd@ninetwozero.com",
        "project": "https://github.com/karllindmark/IsYourProjectUpToDate",
        "new_issue": "https://github.com/karllindmark/IsYourProjectUpToDate/issues/new"
    }
    pages = _get_pages("about")
    return render(request, 'about.html', locals())

def _get_pages(page):
    return [{"title": "Home", "url": "/", "selected": page == "home"},
            {"title": "About", "url": "/", "selected": page == "about"}]