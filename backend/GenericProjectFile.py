class GenericProjectFile ():
    def __init__(self, name, result):
        self.name = name
        self.result = result

    def extract(self):
        raise NotImplementedError("extract() needs to be implemented in " + __name__)

