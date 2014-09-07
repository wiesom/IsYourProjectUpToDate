""" Module for the different project files """
from backend.projectfiles.GradleProjectFile import GradleProjectFile
from backend.projectfiles.MavenProjectFile import MavenProjectFile

MVN_CENTRAL_API = 'http://search.maven.org/solrsearch/select?q=g:"{group}"+a:"{artifact}"'
PROJECT_FILES = {
    "gradle": {
        "name": "Gradle",
        "file": "build.gradle",
        "urls": [MVN_CENTRAL_API]
    }, "maven": {
        "name": "Maven",
        "file": "pom.xml",
        "urls": [MVN_CENTRAL_API]
    }
}


class ProjectFileBuilder(object):
    """ Class that acts like a factory method """
    @staticmethod
    def create(type, name, result):
        if type == 'gradle':
            return GradleProjectFile(name, result)
        elif type == 'maven':
            return MavenProjectFile(name, result)
        else:
            raise NotImplementedError('Type "%s" has not been implemented.' % type)
