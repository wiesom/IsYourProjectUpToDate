from distutils.version import LooseVersion
from requests.packages.urllib3.exceptions import ProtocolError, ConnectionError, ConnectTimeoutError
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
        return JsonHttpResponseBuilder("ERROR", "Invalid request.")

    url = GITHUB_LIST_URL.format(github_info=github_info)
    try:
        response = requests.get(url).json()
    except (ProtocolError, ConnectTimeoutError, ConnectionError):
        return JsonHttpResponseBuilder("ERROR",
                                       "Request failed while connecting to Github. " +
                                       "Please try again later.").build()

    if response.get('errors'):
        return JsonHttpResponseBuilder("ERROR", "Invalid user or repository name. Please try again.").build()
    elif not response.get('items'):
        return JsonHttpResponseBuilder("ERROR",
                                       "The given project is not running Gradle. Unable to help at the moment").build()

    gradle_files = [gradle_file
                    for gradle_file in response.get('items')
                    if fnmatch.fnmatch(gradle_file['name'], "build.gradle")]
    return JsonHttpResponseBuilder("SUCCESS", "", {"files": gradle_files}).build()


def find_dependencies(request):
    selected_files = request.POST.getlist('selected')

    dependencies = []
    for selected_file in selected_files:
        try:
            response = requests.get(selected_file.replace("/blob/", "/raw/"))
        except (ProtocolError, ConnectTimeoutError, ConnectionError):
            return JsonHttpResponseBuilder("ERROR",
                                           "Request failed while fetching the project files. " +
                                           "Please try again later.").build()
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
    try:
        response = requests.get(url).json()['response']
    except (ProtocolError, ConnectTimeoutError, ConnectionError, KeyError):
        return JsonHttpResponseBuilder("ERROR", "Request failed. Please try again later.").build()

    if response.get('numFound', 0) == 0:
        return JsonHttpResponseBuilder("ERROR", "Not available in Maven Central.", {"gav_string": gav_string}).build()

    latest_version = response['docs'][0]['latestVersion']

    if version != '+' and LooseVersion(latest_version) > LooseVersion(version):
        gav_string = group + ':' + artifact + ':' + latest_version
        return JsonHttpResponseBuilder("UPDATE_FOUND",
                                       str(latest_version),
                                       {"gav_string": gav_string, 'new_version': latest_version}).build()
    else:
        return JsonHttpResponseBuilder("UP-TO-DATE", str(latest_version), {"gav_string": gav_string}).build()