from django.http import HttpResponse, HttpResponseBadRequest
import json
import requests
import fnmatch
from backend.GradleProjectFile import GradleProjectFile

GITHUB_API_HOST = "https://api.github.com"
GITHUB_LIST_URL = GITHUB_API_HOST + "/search/code?q=\.gradle+in:path+repo:{github_info}"

MVN_CENTRAL_API = "http://search.maven.org/solrsearch"
MVN_URL = MVN_CENTRAL_API + '/select?q=g:"{group}"+a:"{artifact}"'

def main(request):
    return HttpResponse(':-)')


def find_gradle_files(request):
    github_info = request.POST.get('github-info')
    if not github_info:
        return HttpResponseBadRequest("Invalid request.")

    data = requests.request('GET', GITHUB_LIST_URL.format(github_info=github_info)).json()['items']
    gradle_files = [gradle_file for gradle_file in data if fnmatch.fnmatch(gradle_file['name'], "*.gradle")]

    return HttpResponse(json.dumps(gradle_files))

def find_dependencies(request):
    selected_files = request.POST.getlist('selected')

    dependencies = []
    for selected_file in selected_files:
        response = requests.get(selected_file.replace("/blob/", "/raw/"))
        dependencies.extend(GradleProjectFile(selected_file, response).extract())
    return HttpResponse(json.dumps(dependencies))


def check_for_updates(request):
    group = request.POST.get("group")
    artifact = request.POST.get("artifact")
    version = request.POST.get("version")

    url = MVN_URL.format(group=group, artifact=artifact)
    response = requests.get(url).json()['response']
    if response['numFound'] == 0:
        return HttpResponse('{"status": "NOT_FOUND", "message": "Not available in Maven Central."}')

    latest_version = response['docs'][0]['latestVersion']
    latest_version_date = response['docs'][0]['timestamp']

    if latest_version > version:
        return HttpResponse('{"status": "UPDATE_FOUND", "message": "' + latest_version + '"}')
    else:
        return HttpResponse('{"status": "UP-TO-DATE", "message": "' + latest_version_date + '"')