import $ from 'jquery';

const TRANSPILER_TARGET = 'https://hack.battlecode.org/compile'

class Compiler {

static Compile(lang, code, callback, error) {
    if (lang === 'java') this.Java(code, callback, error);
    else if (lang === 'javascript') this.JS(code, callback, error);
    else if (lang === 'python') this.Python(code, callback, error);
}

static Python(code, callback, error) {
let source = `
bc = {
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

class BCAbstractRobot:
    def __init__(self):
        self._bc_game_state = None
        self._bc_signal = None
        self._bc_clear_logs = False

        self._bc_logs = []

        # Robot id, never changes.
        self.id = null

    def _do_turn(self, game_state):
        self._bc_game_state = game_state
        if not self.id:
            self.id = self.me().id

        for i in range(len(self._bc_game_state.visible)):
            r = self._bc_game_state.visible[i]
            if r.id == self.id:
                self._bc_game_state.visible[i] = {'id':r.id,'x':r.x,'y':r.y,'signal':r.signal,'health':r.health,'team':r.team}
            else:
                self._bc_game_state.visible[i] = {'id':r.id,'x':r.x,'y':r.y,'signal':r.signal}
        
        t = self.turn()
        if not t:
            t = self._bc_null_action()
        
        self._bc_clear_logs = True
        return t

    def _bc_action(self, dir, action):
        return {
            'signal': self._bc_signal,
            'logs': self._bc_logs,
            'dir': dir,
            'action': action
        }

    def _bc_null_action(self):
        return {
            'signal': self._bc_signal,
            'logs': self._bc_logs
        }

    def signal(self, value):
        self._bc_signal = value

    def get_robot(self, id):
        if id <= 0:
            return None
        for robot in self._bc_game_state.visible:
            if robot.id == id:
                return robot

    def get_visible_map(self):
        return self._bc_game_state.shadow

    def get_visible_robots(self):
        return self._bc_game_state.visible

    def me(self):
        return self.get_robot(self.get_visible_map()[3][3])

    def get_relative_pos(self, dx, dy):
        if dx < -3 or dx > 3 or dy < -3 or dy > 3:
            return None

        vis = self.get_visible_map()[dy+3][dx+3]
        if vis > 0:
            return self.get_robot(vis)
        else:
            return vis

    def get_in_direction(self, direction):
        if direction == bc.NORTH:
            return self.get_relative_pos(0, -1)
        elif direction == bc.SOUTH:
            return self.get_relative_pos(0,  1)
        elif direction == bc.WEST:
            return self.get_relative_pos(-1, 0)
        elif direction == bc.EAST:
            return self.get_relative_pos(1,  0)
        elif direction == bc.SOUTHWEST:
            return self.get_relative_pos(-1, 1)
        elif direction == bc.NORTHWEST:
            return self.get_relative_pos(-1,-1)
        elif direction == bc.SOUTHEAST:
            return self.get_relative_pos(1,  1)
        else:
            return self.get_relative_pos(1,-1)

    def log(self, message):
        if self._bc_clear_logs:
            self._bc_logs = []
            self._bc_clear_logs = False

        if isinstance(message,str):
            self._bc_logs.append(message)
        else:
            self._bc_logs.append(str(message))

    def move(self, direction):
        return self._bc_action(direction, 'move')

    def attack(self, direction):
        return self._bc_action(direction, 'attack')

    def turn(self):
        return None

${code}

robot = MyRobot()
`

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

    @jsweet.lang.Optional
    public int health;
    @jsweet.lang.Optional
    public int team;
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

    public BCAbstractRobot() {
        logs = new ArrayList<String>();
    }

    public Action _do_turn(GameState _gameState) {
        gameState = _gameState;
        id = me().id;

        Action t = turn();
        if (t == null) t = new Action(signal, logs);;
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

    public void log(String message) {
        if (clearLogs) {
            logs.clear();
            clearLogs = false;
        }
        
        logs.add(message);
    }

    public Action move(int direction) {
        return new ActiveAction("move",direction,signal,logs);
    }

    public Action attack(int direction) {
        return new ActiveAction("attack",direction,signal,logs);
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
    
    public ActiveAction(String type, int direction, int signal, ArrayList<String> logs) {
        super(signal, logs);
        this.dir = direction;
        this.action = type;
    }
}
`

let action = `
package robot;
import java.util.ArrayList;

public class Action {
    int signal;
    ArrayList<String> logs;
    
    public Action(int signal, ArrayList<String> logs) {
        this.signal = signal;
        this.logs = logs;
    }
}`

let message = {'lang':'java', 'src':[
    {'filename':'BCAbstractRobot.java', 'source':abstract_robot},
    {'filename':'Action.java', 'source':action},
    {'filename':'MyRobot.java', 'source':code},
    {'filename':'GameState.java', 'source':game_state},
    {'filename':'Robot.java', 'source':robot},
    {'filename':'bc.java', 'source':bc},
    {'filename':'ActiveAction.java','source':active_action}
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

function insulate(content) {
    return JSON.parse(JSON.stringify(content));
}

class BCAbstractRobot {
    constructor() {
        // Internal robot state representation
        this._bc_game_state = null;
        this._bc_signal = null;

        this._bc_in_browser = (typeof _bc_browser_log !== 'undefined');
        this._bc_logs = [];
        this._bc_clear_logs = false;

        // Robot id, never changes.
        this.id = null;
    }

    // Hook called by runtime, sets state and calls turn.
    _do_turn(game_state) {
        this._bc_game_state = game_state;
        if (!this.id) this.id = this.me().id;
        if (!this.id) this.team = this.me().team;
        var t = this.turn();
        if (!t) t = this._bc_null_action();

        this._bc_clear_logs = true;
        return t;
    }

    // Action template
    _bc_action(dir, action) {
        return {
            'signal': this._bc_signal,
            'logs': this._bc_logs,
            'dir': dir,
            'action': action
        };
    }

    // Action template
    _bc_null_action() {
        return {
            'signal': this._bc_signal,
            'logs': this._bc_logs
        };
    }
    
    // Set signal value.
    signal(value) {
        this._bc_signal = value;
    }

    // Get robot of a given ID
    getRobot(id) {
        if (id <= 0) return null;
        for (var i=0; i<this._bc_game_state.visible.length; i++) {
            if (this._bc_game_state.visible[i].id === id) {
                return insulate(this._bc_game_state.visible[i]);
            }
        } return null;
    }

    // Get current robot vision.
    getVisibleMap() {
        return insulate(this._bc_game_state.shadow);
    }

    // Get a list of robots visible to you.
    getVisibleRobots() {
        return insulate(this._bc_game_state.visible);
    }

    // Get me.
    me() {
        return this.getRobot(this.getVisibleMap()[3][3]);
    }

    // Get the square dx, dy away.
    getRelativePos(dX, dY) {
        if (dX < -3 || dX > 3 || dY < -3 || dY > 3) return null;
        var vis = this.getVisibleMap()[3+dY][3+dX];

        if (vis > 0) return this.getRobot(vis);
        else return vis;
    }

    getInDirection(direction) {
        var pos = [];
        if (direction === bc.NORTH) pos = [0,-1];
        else if (direction === bc.SOUTH) pos = [0,1];
        else if (direction === bc.WEST) pos = [-1,0];
        else if (direction === bc.EAST) pos = [1,0];
        else if (direction === bc.SOUTHWEST) pos = [-1,1];
        else if (direction === bc.NORTHWEST) pos = [-1,-1];
        else if (direction === bc.SOUTHEAST) pos = [1,1];
        else pos = [1,-1];

        return this.getRelativePos(pos[0], pos[1]);
    }

    // If in browser, direct print, otherwise put in message.
    log(message) {
        if (this._bc_clear_logs) {
            this._bc_logs = [];
            this._bc_clear_logs = false;
        }

        if (this._bc_in_browser) _bc_browser_log(this.id, ""+message);
        else this._bc_logs.push(""+message);
    }

    // Move in a direction
    move(direction) {
        return this._bc_action(direction, 'move');
    }

    // Attack in a direction
    attack(direction) {
        return this._bc_action(direction, 'attack');
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
