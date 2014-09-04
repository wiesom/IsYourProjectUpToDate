from django.http import HttpResponse
import json

class JsonHttpResponseBuilder:
    def __init__(self, status, message, extras):
        self.status = status
        self.message = message
        self.extras = extras

    def build(self):
        response = {"status": self.status, "message": self.message}
        for key, value in self.extras.iteritems():
            response[key] = value
        return HttpResponse(json.dumps(response))
