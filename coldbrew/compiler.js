var axios = require('axios');
var SPECS = require('./specs');

var rollup = require('rollup');
var virtual = require('rollup-plugin-virtual');

var JS_STARTER = require('./starter/js_starter');
var PYTHON_STARTER = require('./starter/python_starter');
var JAVA_STARTER = require('./starter/java_starter');

var TRANSPILER_TARGET = 'http://battlecode.org/compile';

//TRANSPILER_TARGET = 'http://localhost:8080/compile'

class Compiler {

    static Compile(code, callback, error) {
        var ext = code[0].filename.substr(code[0].filename.lastIndexOf('.') + 1);
        if (ext === 'java') this.Java(code, callback, error);
        else if (ext === 'js') this.JS(code, callback, error);
        else if (ext === 'py') this.Python(code, callback, error);
        else if (ext === 'bcx') callback(code[0].source);
        else console.log("Unrecognized file extension.");
    }

    static Python(code, callback, error) {
        code = code.filter(file => file.filename.endsWith('.py'));

        if (!code.some(file => file.filename === 'robot.py')) error("Could not find robot.py.")

        code.push({'filename':'battlecode.py', 'source':PYTHON_STARTER});

        axios.post(TRANSPILER_TARGET, {
            'lang':'python','src':code
        }).then(function(response) {
            if (response.data['success']) {                
                rollup.rollup({
                    input: {'robot':'robot.js'},
                    plugins: [ virtual(response.data['js']) ]
                }).then(function(bundle) {
                    bundle.generate({name:'robot',format:'esm'}).then(function(out) {
                        var code = out.output[0].code.split("\n");
                        code.splice(code.length-4,100);
                        code.push("var robot = new MyRobot();")
                        code = code.join('\n');

                        callback(code);
                    }).catch(function(e) {
                        error(e);
                    });
                }).catch(function(e) {
                    error(e);
                });

            } else error(response.data['error']);
        }).catch(function(e) {
            console.log(e);
            error("Improper request, or server down.");
        });
    }

    static Java(code, callback, error) {
        code = code.filter(file => file.filename.endsWith('.java'));

        if (!code.some(file => file.filename === 'MyRobot.java')) error("Could not find MyRobot.Java.")
        
        for (var filename in JAVA_STARTER) {
            code.push({'filename':filename, 'source':JAVA_STARTER[filename]});
        }

        axios.post(TRANSPILER_TARGET, {
            'lang':'java','src':code
        }).then(function(response) {
            if (response.data['success']) {
                var postfix = "\nvar specs = " + JSON.stringify(SPECS) + ";\nvar robot = new bc19.MyRobot(); robot.setSpecs(specs);";
                callback(response.data['js']+postfix);
            } else {
                error(response.data['error']);
            }
        }).catch(function(e) {
            //console.log(e);
            error("Improper request, or server down.");
        });
    }

    static JS(code, callback, error) {
        var input = {};
        var is_robot = false;
        for (var i=0; i<code.length; i++) {
            if (!code[i].filename.endsWith('.js')) continue;
            if (code[i].filename === 'robot.js') is_robot = true;
            input[code[i].filename] = code[i].source;
        }

        if (!is_robot) error("No robot.js provided.");

        input['robot.js'] += "\nvar robot = new MyRobot();";
        input['battlecode'] = JS_STARTER;

        rollup.rollup({
            input: {'robot':'robot.js'},
            plugins: [ virtual(input) ]
        }).then(function(bundle) {
            bundle.generate({format:'cjs'}).then(function(out) {
                callback(out.output[0].code);
            }).catch(function(e) {
                error(e);
            });
        }).catch(function(e) {
            error(e);
        });
    }
}


module.exports = Compiler;

