""" Module for the different project files """
from backend.projectfiles.GradleProjectFile import GradleProjectFile
from backend.projectfiles.MavenProjectFile import MavenProjectFile
from backend.projectfiles.RubygemsProjectFile import RubygemsProjectFile

MVN_CENTRAL_API = 'http://search.maven.org/solrsearch/select?q=g:"{group}"+a:"{artifact}"'
RUBYGEMS_API = "https://rubygems.org/api/v1/gems/{artifact}.json"
PROJECT_FILES = {
    "gradle": {
        "name": "Gradle",
        "file": "build.gradle",
        "urls": [MVN_CENTRAL_API]
    }, "maven": {
        "name": "Maven",
        "file": "pom.xml",
        "urls": [MVN_CENTRAL_API]
    },
    "rubygems": {
        "name": "Rubygems",
        "file": "Gemfile",
        "urls": [RUBYGEMS_API],
        "excludes": ["vendor/*"]
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
        elif type == 'rubygems':
            return RubygemsProjectFile(name, result)
        else:
            raise NotImplementedError('Type "%s" has not been implemented.' % type)
