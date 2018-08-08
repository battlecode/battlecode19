from flask import Flask, request, jsonify
import java, js, python

app = Flask(__name__)

class InvalidUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@app.route("/", methods=['GET'])
def index():
    return "Hello World!"


@app.route("/compile", methods=['POST'])
def compile():
    args = request.get_json()

    if not 'src' in args:
        raise InvalidUsage("Must provide a source.", status_code=422)
    if not 'lang' in args:
        raise InvalidUsage("Must specify compilation language.", status_code=422)

    # Intake a list of files rather than a source for Java
    if args['lang'] == 'java':
        if isinstance(args['src'], (list,)):
            for src in args['src]:
                if isinstance(src, dict) and 'source' in src and 'filename' in src:
                    src['source'] = str(src['source'])
                    src['filename'] = str(src['filename']).split('/')[0]
                else:
                    raise InvalidUsage("Must provide source and filename for Java files.")
        else:
            raise InvalidUsage("Must provide list of JSON sources for Java target.", status_code=422)
        
	return jsonify(java.compile(args['src']))

    elif args['lang'] == 'js':
        return jsonify(js.compile(str(args['src'])))

    elif args['lang'] == 'python':
        return jsonify(python.compile(str(args['src'])))

    else:
        raise InvalidUsage("Invalid language specified.", status_code=400)


if __name__ == "__main__":
    # Only for debugging while developing
    app.run(host='0.0.0.0', debug=False, port=8080)
