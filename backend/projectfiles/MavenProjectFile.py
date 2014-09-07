from backend.projectfiles import GenericProjectFile
from bs4 import BeautifulSoup

class MavenProjectFile(GenericProjectFile):
    """ Maven project file implementation to extract dependencies """
    def extract(self):
        dependencies = []

        root = BeautifulSoup(self.result.text)
        for dependency in root.find_all('dependency'):
            dependencies.append({"g": dependency.groupid.text,
                                 "a": dependency.artifactid.text,
                                 "v": dependency.version.text})
        return dependencies