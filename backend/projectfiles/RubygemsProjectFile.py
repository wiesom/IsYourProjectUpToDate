from backend.projectfiles.GenericProjectFile import GenericProjectFile
from bs4 import BeautifulSoup


#TODO Remove me - WIP
import logging
logging.basicConfig()
logger = logging.getLogger(__name__)
##


class RubygemsProjectFile(GenericProjectFile):
    """ Rubygems project file implementation to extract dependencies """
    def extract(self):
        dependencies = []

        #root = BeautifulSoup(self.result.text)
        #for dependency in root.find_all('dependency'):
        #    dependencies.append({"g": dependency.groupid.text,
        #                         "a": dependency.artifactid.text,
        #                         "v": dependency.version.text})
        
        logger.error(self.result.text)

        return dependencies
