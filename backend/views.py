from datetime import date
from django.http import HttpResponse, HttpResponseBadRequest
from JsonHttpResponseBuilder import JsonHttpResponseBuilder

import requests
import fnmatch
from backend.GradleProjectFile import GradleProjectFile

GITHUB_API_HOST = "https://api.github.com"
GITHUB_LIST_URL = GITHUB_API_HOST + "/search/code?q=build.gradle+in:path+repo:{github_info}"

MVN_CENTRAL_API = "http://search.maven.org/solrsearch"
MVN_URL = MVN_CENTRAL_API + '/select?q=g:"{group}"+a:"{artifact}"'

def main(request):
    return JsonHttpResponseBuilder("NOT_IMPLEMENTED", ":-)")


def find_gradle_files(request):
    github_info = request.POST.get('github-info')
    if not github_info:
        return HttpResponseBadRequest("Invalid request.")

    data = requests.request('GET', GITHUB_LIST_URL.format(github_info=github_info)).json()
    if data.get('errors') or not data.get('items'):
        return JsonHttpResponseBuilder("INVALID_USER_REPO", "Invalid user or repository name. Please try again.").build()

    gradle_files = [gradle_file for gradle_file in data.get('items') if fnmatch.fnmatch(gradle_file['name'], "build.gradle")]
    return JsonHttpResponseBuilder("SUCCESS", "", {"files": gradle_files}).build()

def find_dependencies(request):
    selected_files = request.POST.getlist('selected')

    dependencies = []
    for selected_file in selected_files:
        response = requests.get(selected_file.replace("/blob/", "/raw/"))
        dependencies.extend(GradleProjectFile(selected_file, response).extract())

    if dependencies:
        return JsonHttpResponseBuilder("SUCCESS", "Dependencies found.", {"dependencies": dependencies}).build()
    else:
        return JsonHttpResponseBuilder("NO_DEPENDENCIES", "No dependencies found.").build()


def check_for_updates(request):
    group = request.POST.get("group")
    artifact = request.POST.get("artifact")
    version = request.POST.get("version")
    gav_string = group + ':' + artifact + ':' + version

    url = MVN_URL.format(group=group, artifact=artifact)
    response = requests.get(url).json()['response']
    if response['numFound'] == 0:
        return JsonHttpResponseBuilder("NOT_FOUND", "Not available in Maven Central.", {"gav_string": gav_string}).build()

    latest_version = response['docs'][0]['latestVersion']

    if latest_version > version:
        gav_string = group + ':' + artifact + ':' + latest_version
        return JsonHttpResponseBuilder("UPDATE_FOUND",
                                       str(latest_version),
                                       {"gav_string": gav_string, 'new_version': latest_version}).build()
    else:
        return JsonHttpResponseBuilder("UP-TO-DATE", str(latest_version), {"gav_string": gav_string}).build()