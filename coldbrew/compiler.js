var axios = require('axios');
var SPECS = require('./specs');
var rollup = require('rollup');
var virtual = require('rollup-plugin-virtual');

var JS_STARTER = require('./starter/js_starter');
var PYTHON_STARTER = require('./starter/python_starter');
var JAVA_STARTER = require('./starter/java_starter');

var TRANSPILER_TARGET = (typeof window === 'undefined') ? 'http://battlecode.org/compile' : 'https://battlecode.org/compile';

class Compiler {

    static Compile(code, callback, error) {
        var ext = code[0].filename.substr(code[0].filename.lastIndexOf('.') + 1);

        if (ext === 'java') this.Java(code, callback, error);
        else if (ext === 'js') this.JS(code, callback, error);
        else if (ext === 'py') this.Python(code, callback, error);
        else console.log("Unrecognized file extension.");
    }

    static Concat(files) {
        var code = "";
        for (var key in files) code += "\n" + files[key];
        return code;
    }

    static Python(code, callback, error) {
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
                        code.push("var robot = {robot: new MyRobot()};")
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

    }

    static JS(code, callback, error) {
        var input = {};
        var is_robot = false;
        for (var i=0; i<code.length; i++) {
            if (!code[i].filename.endsWidth('.js')) continue;
            if (code[i].filename === 'robot.js') is_robot = true;
            input[code[i].filename] = code[i].source;
        }

        if (!is_robot) error("No robot.js provided.");

        input['robot.js'] += "\nvar robot = {robot: new MyRobot()};";
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


/*
static Java(code, callback, error) {

let game_state = `
package robot;
import java.util.ArrayList;

@jsweet.lang.Interface
public class GameState {
    public int[][] shadow;
    public ArrayList<Robot> visible;
}
`

let bc = `
package robot;

public class bc {
    public static final int NORTH = 2;
    public static final int NORTHEAST = 1;
    public static final int EAST = 0;
    public static final int SOUTHEAST = 7;
    public static final int SOUTH = 6;
    public static final int SOUTHWEST = 5;
    public static final int WEST = 4;
    public static final int NORTHWEST = 3;
    public static final int EMPTY = 0;
    public static final int HOLE = -1;
}
`

let robot = `
package robot;

@jsweet.lang.Interface
public class Robot {
    public int id;
    public int signal;
    public int x;
    public int y;
    public int team;

    @jsweet.lang.Optional
    public int health;
}
`

let abstract_robot = `
package robot;
import java.util.ArrayList;

public class BCAbstractRobot {
    private GameState gameState;
    private int signal;
    private boolean clearLogs;
    private ArrayList<String> logs;
    private int id;
    private int nexus;

    public BCAbstractRobot() {
        logs = new ArrayList<String>();
        nexus = -1;
    }

    public Action _do_turn(GameState _gameState) {
        gameState = _gameState;
        id = me().id;

        Action t = turn();
        if (t == null) t = new Action(signal, logs, nexus);
        clearLogs = true;

        return t;
    }

    public void signal(int value) {
        signal = value;
    }

    public Robot getRobot(int id) {
        if (id <= 0) return null;
        for (Robot r : gameState.visible) {
            if (r.id == id) {
                return r;
            }
        } return null;
    }

    public int[][] getVisibleMap() {
        return gameState.shadow;
    }

    public int getRelativePos(int dX, int dY) {
        return getVisibleMap()[3+dY][3+dX];
    }

    public int getInDirection(int direction) {
        if (direction == bc.NORTH)          return getRelativePos(0, -1);
        else if (direction == bc.SOUTH)     return getRelativePos(0,  1);
        else if (direction == bc.WEST)      return getRelativePos(-1, 0);
        else if (direction == bc.EAST)      return getRelativePos(1,  0);
        else if (direction == bc.SOUTHWEST) return getRelativePos(-1, 1);
        else if (direction == bc.NORTHWEST) return getRelativePos(-1,-1);
        else if (direction == bc.SOUTHEAST) return getRelativePos(1,  1);
        else return getRelativePos(1,-1);
    }

    public ArrayList<Robot> getVisibleRobots() {
        return gameState.visible;
    }

    public Robot me() {
        return getRobot(getVisibleMap()[3][3]);
    }

    public void nexus(int direction) {
        nexus = direction;
    }

    public void log(String message) {
        if (clearLogs) {
            logs.clear();
            clearLogs = false;
        }
        
        logs.add(message);
    }

    public Action move(int direction) {
        return new ActiveAction("move",direction,signal,logs,nexus);
    }

    public Action attack(int direction) {
        return new ActiveAction("attack",direction,signal,logs,nexus);
    }

    public Action fuse() {
        return new FuseAction(signal,logs,nexus);
    }
    
    public Action turn() {
        return null;
    }
}
`

let active_action = `
package robot;
import java.util.ArrayList;

public class ActiveAction extends Action {
    String action;
    int dir;
    
    public ActiveAction(String type, int direction, int signal, ArrayList<String> logs, int nexus) {
        super(signal, logs, nexus);
        this.dir = direction;
        this.action = type;
    }
}
`

let fuse_action = `
package robot;
import java.util.ArrayList;

public class FuseAction extends Action {
    String action;
    
    public FuseAction(int signal, ArrayList<String> logs, int nexus) {
        super(signal, logs, nexus);
        this.action = "fuse";
    }
}
`

let action = `
package robot;
import java.util.ArrayList;

public class Action {
    int signal;
    ArrayList<String> logs;
    int nexus;
    
    public Action(int signal, ArrayList<String> logs, int nexus) {
        this.signal = signal;
        this.logs = logs;
        this.nexus = nexus;
    }
}`

let message = {'lang':'java', 'src':[
    {'filename':'BCAbstractRobot.java', 'source':abstract_robot},
    {'filename':'Action.java', 'source':action},
    {'filename':'MyRobot.java', 'source':code},
    {'filename':'GameState.java', 'source':game_state},
    {'filename':'Robot.java', 'source':robot},
    {'filename':'bc.java', 'source':bc},
    {'filename':'ActiveAction.java','source':active_action},
    {'filename': 'FuseAction.java', 'source':fuse_action }
]}

let postfix = "\nvar robot = {'robot':new robot.MyRobot()};";

$.ajax({
    type: "POST",
    url: TRANSPILER_TARGET,
    data: JSON.stringify(message),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(data){
        if (data['success']) callback(data['js']+postfix);
        else error(data['error']);
    },
    failure: function(errMsg) {
        console.log("FAILURE: " + errMsg);
    }
});


}


}

export default Compiler;*/
module.exports = Compiler;

