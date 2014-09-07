from distutils.version import LooseVersion
import fnmatch

from requests.packages.urllib3.exceptions import ProtocolError, ConnectionError, ConnectTimeoutError
import requests

from backend.JsonHttpResponseBuilder import JsonHttpResponseBuilder
from backend.projectfiles import ProjectFileBuilder, PROJECT_FILES

GITHUB_API_HOST = "https://api.github.com"
GITHUB_LIST_URL = GITHUB_API_HOST + "/search/code?q={project_file}+in:path+repo:{github_info}"

def not_in(excludes, file_path):
    if not excludes:
        # No excludes is used for this project
        return True
    for excluded_path in excludes:
        # There are excludes in this project
        if fnmatch.fnmatch(file_path, excluded_path):
            # If the path matches the excluded path, return False
            # Indicating that the given path should be excluded
            return False
    # If we've searched in all the excluded paths and didn't find any match
    return True


def find_project_files(request):
    github_info = request.POST.get('github-info')
    project_type = request.POST.get('project-type')
    project = PROJECT_FILES.get(project_type)

    if not github_info or not project_type:
        return JsonHttpResponseBuilder("ERROR", "Oops, something bad happened.").build()
    elif not project:
        return JsonHttpResponseBuilder("ERROR", "Unsupported project type: " + project_type).build()

    url = GITHUB_LIST_URL.format(project_file=project.get('file'), github_info=github_info)
    try:
        response = requests.get(url).json()
    except (ProtocolError, ConnectTimeoutError, ConnectionError):
        return JsonHttpResponseBuilder("ERROR", "Unable to connect to Github. Please try again later.").build()

    if response.get('errors'):
        return JsonHttpResponseBuilder("ERROR", "Invalid user or repository name. Please try again.").build()
    elif not response.get('items'):
        return JsonHttpResponseBuilder("ERROR", "The given project is not using " + project.get('name') + ".").build()

    project_files = [file_path
                     for file_path in response.get('items')
                     if fnmatch.fnmatch(file_path['name'], project.get('file')) 
                        and not_in(project.get("excludes"),str(file_path['path']))]

    return JsonHttpResponseBuilder("SUCCESS", "", {"files": project_files}).build()


def find_dependencies(request):
    selected_files = request.POST.getlist('selected')
    project_type = request.POST.get('project-type')

    if not selected_files:
        return JsonHttpResponseBuilder("ERROR", "No project files selected.").build()
    elif not project_type:
        return JsonHttpResponseBuilder("ERROR", "No project type selected.").build()

    dependencies = []
    for selected_file in selected_files:
        try:
            response = requests.get(selected_file.replace("/blob/", "/raw/"))
        except (ProtocolError, ConnectTimeoutError, ConnectionError):
            return JsonHttpResponseBuilder("ERROR",
                                           "Request failed while fetching the project files. " +
                                           "Please try again later.").build()
        dependencies.extend(ProjectFileBuilder.create(project_type, selected_file, response).extract())

    if dependencies:
        return JsonHttpResponseBuilder("SUCCESS", "Dependencies found.", {"dependencies": dependencies}).build()
    else:
        return JsonHttpResponseBuilder("NO_DEPENDENCIES", "No dependencies found.").build()


# TODO: This is too specific for Gradle + Maven (especially Maven Central)
def check_for_updates(request):
    group = request.POST.get("group")
    artifact = request.POST.get("artifact")
    version = request.POST.get("version")
    project_type = request.POST.get("project-type")

    if not project_type:
        return JsonHttpResponseBuilder("ERROR", "Missing project type.").build()

    gav_string = group + ':' + artifact + ':' + version

    urls = PROJECT_FILES[project_type]['urls']
    for url in urls:
        url = url.format(group=group, artifact=artifact)
        try:
            response = requests.get(url).json()['response']
        except (ProtocolError, ConnectTimeoutError, ConnectionError, KeyError):
            return JsonHttpResponseBuilder("ERROR", "Request failed. Please try again later.").build()

        if response.get('numFound', 0) == 0:
            continue

        latest_version = response['docs'][0]['latestVersion']

        if version != '+' and LooseVersion(latest_version) > LooseVersion(version):
            gav_string = group + ':' + artifact + ':' + latest_version
            return JsonHttpResponseBuilder("UPDATE_FOUND",
                                           str(latest_version),
                                           {"gav_string": gav_string, 'new_version': latest_version}).build()
        else:
            return JsonHttpResponseBuilder("UP-TO-DATE", str(latest_version), {"gav_string": gav_string}).build()
    return JsonHttpResponseBuilder("ERROR", "Not available in Maven Central.", {"gav_string": gav_string}).build()