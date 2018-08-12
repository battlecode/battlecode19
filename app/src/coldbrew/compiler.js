import $ from 'jquery';

const TRANSPILER_TARGET = 'http://35.233.200.194/compile'

class Compiler {

static Compile(lang, code, callback, error) {
    if (lang === 'java') this.Java(code, callback, error);
    else if (lang === 'javascript') this.JS(code, callback, error);
    else if (lang === 'python') this.Python(code, callback, error);
}

static Python(code, callback, error) {
let source = `
class BCAbstractRobot:
    def __init__(self):
        self.game_state = None
    def _do_turn(self, game_state):
        self.game_state = game_state
        return self.turn()
    def move(self, dir):
        return {'action':'move', 'dir':dir}
    def turn(self):
        return None

${code}

robot = MyRobot()`

let message = {'lang':'python', 'src':source}

$.ajax({
    type: "POST",
    url: TRANSPILER_TARGET,
    data: JSON.stringify(message),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(data){
        if (data['success']) {
            var d = data['js'].split("\n");
            d[d.length-4] = 'var robot = robot();'
            d[0] = "";
            d = d.join("\n");
            callback(d);
        } else error(data['error']);
    },
    failure: function(errMsg) {
        console.log("FAILURE: " + errMsg);
    }
});

}

static Java(code, callback, error) {

let bc_abstract_robot = `
package robot;
import java.util.ArrayList;

public class BCAbstractRobot {
    private Object gameState;
    private int signal;
    private boolean clearLogs;
    private ArrayList<String> logs;

    public BCAbstractRobot() {
        logs = new ArrayList<String>();
    }
    
    public Action move(int direction) {
        return new Action("move",direction,signal,logs);
    }

    public void signal(int signal) {
        this.signal = signal;
    }

    public void log(String message) {
        if (clearLogs) logs.clear();
        logs.add(message);
    }
    
    public Action _do_turn(Object gameState) {
        this.gameState = gameState;
        this.clearLogs = true;
        return turn();
    }
    
    public Action turn() {
        return null;
    }
}
`

let action = `
package robot;
import java.util.ArrayList;

public class Action {
    String action;
    int dir;
    int signal;
    ArrayList<String> logs;
    
    public Action(String type, int direction, int signal, ArrayList<String> logs) {
        this.dir = direction;
        this.action = type;
        this.signal = signal;
        this.logs = logs;
    }
}
`

let message = {'lang':'java', 'src':[
    {'filename':'BCAbstractRobot.java', 'source':bc_abstract_robot},
    {'filename':'Action.java', 'source':action},
    {'filename':'MyRobot.java', 'source':code}
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

static JS(code, callback) {
let res =  `
let bc = {
    'NORTH':     2,
    'NORTHEAST': 1,
    'EAST':      0,
    'SOUTHEAST': 7,
    'SOUTH':     6,
    'SOUTHWEST': 5,
    'WEST':      4,
    'NORTHWEST': 3,
    'EMPTY':     0,
    'HOLE':     -1
}

class BCAbstractRobot {
    constructor() {
        // Internal robot state representation
        this._bc_game_state = null;
        this._bc_signal = null;

        this._bc_in_browser = (typeof _bc_browser_log !== 'undefined');
        this._bc_logs = [];

        // Robot id, never changes.
        this.id = null;
    }

    // Hook called by runtime, sets state and calls turn.
    _do_turn(game_state) {
        this._bc_game_state = game_state;
        if (!this.id) this.id = this.me().id;
        return this.turn();   
    }

    // Action template
    _bc_action(dir, action) {
        return {
            'signal': this.signal,
            'logs': this._bc_logs,
            'dir': dir,
            'action': action
        };
    }
    
    // Set signal value.
    signal(value) {
        this.signal = value;
    }

    // Get robot of a given ID
    getRobot(id) {
        if (id <= 0) return null;
        for (var i=0; i<this._bc_game_state.visible.length; i++) {
            if (this._bc_game_state.visible[i].id === id) {
                return this._bc_game_state.visible[i];
            }
        } return null;
    }

    // Get current robot vision.
    getVisibleMap() {
        return this._bc_game_state.shadow;
    }

    // Get a list of robots visible to you.
    getVisibleRobots() {
        return this._bc_game_state.visible;
    }

    // Get me.
    me() {
        return getRobot(this.getVision()[3][3]);
    }

    // Get the square dx, dy away.
    getRelativePos(dX, dY) {
        if (dX < -3 || dX > 3 || dY < -3 || dY > 3) return null;
        var vis = getVision()[dY][dX];

        if (vis > 0) return getRobot(vis);
        else return vis;
    }

    // If in browser, direct print, otherwise put in message.
    log(message) {
        if (this._bc_in_browser) _bc_browser_log(this.id, message);
        else this._bc_logs.push(message);
    }

    // Move in a direction
    move(direction) {
        return this._bc_action(dir, 'move');
    }

    // Attack in a direction
    move(direction) {
        return this._bc_action(dir, 'attack');
    }

    turn() {
        return null;
    }
}


${code}

var robot = {'robot':new MyRobot()};
`

callback(res);

}

}

export default Compiler;
