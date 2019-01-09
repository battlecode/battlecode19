var axios = require('axios');
var SPECS = require('./specs');

var JS_STARTER = require('./starter/js_starter');
var PYTHON_STARTER = require('./starter/python_starter');
var JAVA_STARTER = require('./starter/java_starter');

var TRANSPILER_TARGET = 'https://battlecode.org/compile';

//TRANSPILER_TARGET = 'http://localhost:8080/compile'

function hackyCombine(string) {
    string = string.replace(/export var/g, 'var').replace(/export function/g, 'function').replace(/export class/g, 'class');

    var lines = "";
    string = string.split('\n');

    for (var i=0; i<string.length; i++) {
        if (!string[i].startsWith('import ')) lines += string[i] + "\n";
    }

    return lines;
}

class Compiler {
    static Compile(lang, source, callback, error) {
        if (lang === 'python') this.Python(source, callback, error);
        else if (lang === 'javascript') this.JS(source, callback, error);
        else if (lang === 'java') this.Java(source, callback, error);
    }

    static Python(c, callback, error) {
        var code = []

        code.push({'filename':'battlecode.py', 'source':PYTHON_STARTER});
        code.push({'filename':'robot.py', 'source':c});

        axios.post(TRANSPILER_TARGET, {
            'lang':'python','src':code
        }).then(function(response) {
            if (response.data['success']) {
                var code = "";
                for (var key in response.data.js) {
                    code += response.data.js[key] + '\n';
                }
                
                code = hackyCombine(code);

                callback(code);
            } else error(response.data['error']);
        }).catch(function(e) {
            console.log(e);
            error("Improper request, or server down.");
        });
    }

    static Java(code, callback, error) {
        code = [{'filename':'MyRobot.java','source':code}];
        
        for (var filename in JAVA_STARTER) {
            code.push({'filename':filename, 'source':JAVA_STARTER[filename]});
        }

        axios.post(TRANSPILER_TARGET, {
            'lang':'java','src':code
        }).then(function(response) {
            if (response.data['success']) {
                var postfix = "\nvar specs = " + JSON.stringify(SPECS) + ";\nvar robot = new bc19.MyRobot();robot.setSpecs(specs);";

                callback(response.data['js']+postfix);
            } else {
                error(response.data['error']);
            }
        }).catch(function(e) {
            console.log(e);
            error("Improper request, or server down.");
        });
    }

    static JS(code, callback, error) {
        var code = JS_STARTER + '\n' + code;

        code = hackyCombine(code);

        callback(code);
    }
}

module.exports = Compiler;

