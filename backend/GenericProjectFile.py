class GenericProjectFile ():
    """ Base class that enforces a contract upon subclasses. Will enable easier extension in the future. :-) """
    def __init__(self, name, result):
        self.name = name
        self.result = result

    def extract(self):
        """
        :return: None (at a base class level); a list of dependencies upon implementing this method
        """
        raise NotImplementedError("extract() needs to be implemented in " + __name__)

