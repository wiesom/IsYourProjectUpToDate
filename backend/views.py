from django.http import HttpResponse, HttpResponseBadRequest
import json
import requests
import fnmatch

GITHUB_API_HOST = "https://api.github.com"
GITHUB_LIST_URL = GITHUB_API_HOST + "/search/code?q=\.gradle+in:path+repo:{github_info}"

def main(request):
    return HttpResponse('Try /find_dependencies or /check_for_updates instead. :-)')


def find_gradle_files(request):
    github_info = request.POST.get('github-info')
    if not github_info:
        return HttpResponseBadRequest("Invalid request.")

    data = requests.request('GET', GITHUB_LIST_URL.format(github_info=github_info)).json()['items']
    gradle_files = [gradle_file for gradle_file in data if fnmatch.fnmatch(gradle_file['name'], "*.gradle")]
    return HttpResponse(json.dumps(gradle_files))

def find_dependencies(request):
    print "YOLO";
    return HttpResponse('{"json": "Finding dependencies for "}')


def check_for_updates(request):
    return HttpResponse('{"json": "32 updates found!"}')