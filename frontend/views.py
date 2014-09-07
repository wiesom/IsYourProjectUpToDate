from django.shortcuts import render
from backend.views import PROJECT_FILES


def main(request):
    project_types = PROJECT_FILES
    return render(request, 'index.html', locals())
